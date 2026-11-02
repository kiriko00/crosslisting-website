import "server-only";
import { notFound } from "next/navigation";
import { requireIdentity } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import type { InventoryItem, ItemPhoto, ItemStatus, MarketplaceListing } from "@/lib/supabase/database.types";
import { PHOTO_BUCKET, uuidPattern } from "@/lib/listing/submission";

export type InventoryRecord = InventoryItem & {
  item_photos: ItemPhoto[];
  marketplace_listings: MarketplaceListing[];
};
export type InventoryView = InventoryRecord & { photos: (ItemPhoto & { url: string | null })[] };

export async function withPhotoUrls(records: InventoryRecord[], allPhotos: boolean): Promise<InventoryView[]> {
  const identity = await requireIdentity();
  const supabase = await createClient();
  const ordered = records.map(item => ({ ...item, item_photos: [...item.item_photos].sort((a, b) => a.sort_order - b.sort_order) }));
  const requested = ordered.flatMap(item => (allPhotos ? item.item_photos : item.item_photos.slice(0, 1)).filter(photo => photo.storage_path.startsWith(`${identity.id}/${item.id}/`)));
  const urls = new Map<string, string>();
  if (requested.length) {
    const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(requested.map(photo => photo.storage_path), 900);
    if (!error) for (const photo of data) if (photo.path && photo.signedUrl && !photo.error) urls.set(photo.path, photo.signedUrl);
  }
  return ordered.map(item => ({ ...item, photos: (allPhotos ? item.item_photos : item.item_photos.slice(0, 1)).map(photo => ({ ...photo, url: urls.get(photo.storage_path) ?? null })) }));
}

export async function getInventory(status?: ItemStatus, page = 1, pageSize = 24, recent = false) {
  const identity = await requireIdentity();
  const supabase = await createClient();
  let query = supabase.from("inventory_items").select("*, item_photos(*), marketplace_listings(*)", { count: "exact" }).eq("user_id", identity.id);
  if (status==="archived") query=query.or("status.eq.archived,deletion_pending.eq.true");
  else { query=query.eq("deletion_pending",false); if(status) query=query.eq("status",status); else query=query.neq("status","archived"); }
  const { data, error, count } = await query.order(recent ? "updated_at" : "created_at", { ascending: false }).order("id").range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw new Error("Your inventory could not be loaded.");
  return { items: await withPhotoUrls(data, false), count: count ?? 0 };
}

export async function getItem(id: string) {
  const identity = await requireIdentity();
  if (!uuidPattern.test(id)) notFound();
  const supabase = await createClient();
  const { data, error } = await supabase.from("inventory_items").select("*, item_photos(*), marketplace_listings(*)").eq("id", id).eq("user_id", identity.id).maybeSingle();
  if (error) throw new Error("This item could not be loaded.");
  // A nonexistent ID and someone else's ID deliberately have the same result.
  if (!data) notFound();
  return (await withPhotoUrls([data], true))[0];
}

export async function getCleanupCount(itemId:string) {
  const owner=await requireIdentity(); const supabase=await createClient();
  const {count,error}=await supabase.from("photo_cleanup_jobs").select("id",{count:"exact",head:true}).eq("user_id",owner.id).eq("item_id",itemId);
  if(error) throw new Error("Photo cleanup state could not be loaded. Apply the lifecycle migration.");
  return count??0;
}

export async function getDashboardCounts() {
  const identity = await requireIdentity();
  const supabase = await createClient();
  const statuses = ["active", "draft", "sold"] as const;
  const counts = await Promise.all(statuses.map(status => supabase.from("inventory_items").select("id", { count: "exact", head: true }).eq("user_id", identity.id).eq("deletion_pending",false).eq("status", status)));
  const attention = await supabase.from("marketplace_listings")
    .select("id, inventory_items!inner(user_id)", { count: "exact", head: true })
    .eq("inventory_items.user_id", identity.id)
    .or("status.eq.error,missing_fields.neq.{},delisting_status.in.(required,pending,error)");
  if (counts.some(result => result.error) || attention.error) throw new Error("Dashboard metrics could not be loaded.");
  return { active: counts[0].count ?? 0, draft: counts[1].count ?? 0, sold: counts[2].count ?? 0, attention: attention.count ?? 0 };
}
