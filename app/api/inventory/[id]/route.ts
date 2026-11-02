import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { listingPayload, masterPayload, parseSubmission, PHOTO_BUCKET, MAX_PHOTOS, MAX_PHOTO_BYTES, photoExtensions, uuidPattern, validatePhoto } from "@/lib/listing/submission";
import { readMultipart } from "@/lib/listing/multipart";
import { persistEdit } from "@/lib/inventory/edit";
import { deleteInventoryItem } from "@/lib/inventory/delete";
import { drainPhotoCleanup } from "@/lib/inventory/storage";
import { parseSale } from "@/lib/inventory/sale";
import { recordSaleAndRequireDelisting } from "@/lib/inventory/sales-service";

export const runtime = "nodejs";
const reply = (body: object, status=200) => {
  if(status===200) revalidatePath("/","layout");
  return NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
};
type Context = { params: Promise<{ id: string }> };
function revision(value: unknown): value is number { return Number.isSafeInteger(value) && Number(value) >= 0; }
async function lifecycleBody(request:Request) {
  if(!request.headers.get("content-type")?.startsWith("application/json") || !request.body) throw new Error("JSON request required");
  const reader=request.body.getReader(); const decoder=new TextDecoder();
  let text=""; let bytes=0;
  for(;;) {
    const chunk=await reader.read(); if(chunk.done) break;
    bytes+=chunk.value.byteLength;
    if(bytes>10000) { await reader.cancel(); throw new Error("Request too large"); }
    text+=decoder.decode(chunk.value,{stream:true});
  }
  return text+decoder.decode();
}
async function owned(request: NextRequest, context: Context) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return { response: reply({error:"Same-origin request required"},403) };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub) return { response: reply({error:"Sign in again before changing inventory."},401) };
  const { id } = await context.params;
  if (!uuidPattern.test(id)) return { response: reply({error:"Item not found"},404) };
  const owner = data.claims.sub;
  const result = await supabase.from("inventory_items").select("*, item_photos(*)").eq("id",id).eq("user_id",owner).maybeSingle();
  if (result.error) return { response: reply({error:"Inventory could not be loaded. Check the lifecycle migration."},503) };
  return { supabase, owner, id, item: result.data };
}

export async function PATCH(request: NextRequest, context: Context) {
  const access = await owned(request,context);
  if (access.response) return access.response;
  const { supabase, owner, id, item } = access;
  if (!item) return reply({error:"Item not found"},404);
  if (item.deletion_pending) return reply({error:"Deletion is pending; retry deletion instead."},409);
  try {
    const body = await readMultipart(request,MAX_PHOTOS*MAX_PHOTO_BYTES+200000);
    const mutation = body.get("mutationId");
    const expected = Number(body.get("revision"));
    if (typeof mutation !== "string" || !uuidPattern.test(mutation) || !revision(expected)) throw new Error("Invalid edit request");
    if (item.last_mutation_id === mutation) return reply({id});
    if (item.revision !== expected) return reply({error:"This item changed. Reload before saving."},409);
    const rawOrder = body.get("photoOrder");
    const rawForm = body.get("listing");
    const mode = body.get("mode");
    if ((mode !== "draft" && mode !== "prepare") || typeof rawForm !== "string" || rawForm.length > 150000 || typeof rawOrder !== "string" || rawOrder.length > 10000) throw new Error("Invalid edit data");
    const order: unknown = JSON.parse(rawOrder);
    if (!Array.isArray(order) || order.length > MAX_PHOTOS) throw new Error("Keep at most 12 photos");
    const files = body.getAll("photos");
    if (files.some(file=>!(file instanceof File))) throw new Error("Invalid photo upload");
    const uploads = files as File[];
    if (uploads.length > MAX_PHOTOS) throw new Error("Too many photo uploads");
    const paths = uploads.map(file => `${owner}/${id}/${crypto.randomUUID()}.${photoExtensions[file.type as keyof typeof photoExtensions]}`);
    const retained = new Set(item.item_photos.map(photo=>photo.storage_path));
    const usedUploads = new Set<number>();
    const orderedPaths = order.map(entry => {
      if (!entry || typeof entry !== "object") throw new Error("Invalid photo order");
      if ("existing" in entry && typeof entry.existing === "string" && retained.has(entry.existing)) return entry.existing;
      if ("upload" in entry && Number.isInteger(entry.upload) && Number(entry.upload)>=0 && Number(entry.upload)<paths.length) {
        if (usedUploads.has(entry.upload)) throw new Error("Duplicate photo upload");
        usedUploads.add(entry.upload); return paths[entry.upload];
      }
      throw new Error("A photo does not belong to this item. Reload before saving.");
    });
    if (usedUploads.size !== uploads.length || new Set(orderedPaths).size !== orderedPaths.length) throw new Error("Invalid or duplicated photo order");
    const form = parseSubmission(JSON.parse(rawForm),mode === "prepare",orderedPaths.length);
    for (const file of uploads) await validatePhoto(file);
    const result = await persistEdit({
      async upload(file,path) { const {error}=await supabase.storage.from(PHOTO_BUCKET).upload(path,file,{contentType:file.type,upsert:false}); if(error) throw new Error("Upload failed"); },
      async remove(unused) { const {error}=await supabase.storage.from(PHOTO_BUCKET).remove(unused); if(error) throw new Error("Cleanup failed"); },
      async commit() {
        const {data,error}=await supabase.rpc("update_inventory_item",{p_id:id,p_revision:expected,p_mutation:mutation,p_master:masterPayload(form.master),p_listings:listingPayload(form,orderedPaths.length),p_photos:orderedPaths.map((storage_path,sort_order)=>({storage_path,sort_order}))});
        if(error || !data || typeof data!=="object" || Array.isArray(data) || data.id!==id) throw new Error("Edit failed");
      },
      async find() {
        const {data,error}=await supabase.from("inventory_items").select("id,last_mutation_id,item_photos(storage_path)").eq("id",id).eq("user_id",owner).maybeSingle();
        if(error) throw new Error("Unable to reconcile edit");
        return data ? {id:data.id,mutation:data.last_mutation_id,paths:data.item_photos.map(photo=>photo.storage_path)} : null;
      },
    },uploads,paths,mutation);
    let warning=result.warning;
    try { await drainPhotoCleanup(supabase,owner,id); } catch { warning=true; }
    return reply({id,...(warning?{warning:"cleanup"}:{})});
  } catch(error) { return reply({error:error instanceof SyntaxError ? "Invalid edit data" : error instanceof Error ? error.message : "Edit failed. Your form is preserved."},400); }
}

export async function POST(request: NextRequest, context: Context) {
  const access=await owned(request,context);
  if(access.response) return access.response;
  const {supabase,owner,id,item}=access;
  try {
    const text=await lifecycleBody(request);
    const input:unknown=JSON.parse(text);
    if(!input || typeof input!=="object" || !("action" in input) || !("revision" in input) || !revision(input.revision)) throw new Error("Invalid lifecycle request");
    const expectedRevision=input.revision;
    if(!item) return input.action==="delete" ? reply({id,deleted:true}) : reply({error:"Item not found"},404);
    if(input.action==="sale") {
      const sale=parseSale(input);
      await recordSaleAndRequireDelisting(supabase,{itemId:id,saleId:sale.saleId,revision:input.revision,payload:sale.payload});
      return reply({id,sold:true});
    }
    if(input.action==="cleanup") { await drainPhotoCleanup(supabase,owner,id); return reply({id}); }
    const rpc=async(action:string) => {
      const {data,error}=await supabase.rpc("inventory_lifecycle",{p_id:id,p_revision:expectedRevision,p_action:action});
      if(error || !data || typeof data!=="object" || Array.isArray(data) || data.id!==id) throw new Error(error?.code==="40001" ? "The item changed, files remain, or external listings need resolution. Reload and archive instead if external delisting is pending." : "Lifecycle action could not be confirmed. Reload before retrying.");
    };
    if(input.action==="archive") { await rpc("archive"); return reply({id,archived:true}); }
    if(input.action!=="delete" || !("confirmation" in input) || input.confirmation!=="DELETE") throw new Error("Type DELETE to confirm permanent deletion");
    const prefix=`${owner}/${id}`;
    await deleteInventoryItem({
      begin:()=>rpc("delete_begin"), finish:()=>rpc("delete_finish"),
      async list() { const {data,error}=await supabase.storage.from(PHOTO_BUCKET).list(prefix,{limit:100,sortBy:{column:"name",order:"asc"}}); if(error) throw new Error("Photo list failed; item retained for retry."); return data; },
      async remove(names) { const {error}=await supabase.storage.from(PHOTO_BUCKET).remove(names.map(name=>`${prefix}/${name}`)); if(error) throw new Error("Photo removal failed; item retained for retry."); },
    });
    return reply({id,deleted:true});
  } catch(error) { return reply({error:error instanceof SyntaxError ? "Invalid lifecycle data" : error instanceof Error ? error.message : "Action failed. Reload before retrying."},400); }
}
