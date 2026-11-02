import "server-only";
import { requireIdentity } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { withPhotoUrls } from "./queries";
import { missingDestinations } from "./missing";

export async function getSales(page:number) {
  const owner=await requireIdentity(); const supabase=await createClient();
  const {data,count,error}=await supabase.from("sales").select("*,inventory_items!inner(*,item_photos(*),marketplace_listings(*))",{count:"exact"}).eq("inventory_items.user_id",owner.id).order("sold_at",{ascending:false}).order("id").range((page-1)*24,page*24-1);
  if(error) throw new Error("Sales could not be loaded");
  const items=await withPhotoUrls(data.map(row=>row.inventory_items),false);
  return {sales:data.map((row,index)=>({...row,item:items[index]})),count:count??0};
}

export async function getListings(view:"all"|"live"|"missing"|"errors",page:number) {
  const owner=await requireIdentity(); const supabase=await createClient();
  if(view==="missing") {
    const {data,error,count}=await supabase.from("inventory_items").select("*,item_photos(*),marketplace_listings(*)",{count:"exact"}).eq("user_id",owner.id).in("status",["draft","active"]).eq("deletion_pending",false).order("created_at",{ascending:false}).order("id").range((page-1)*24,page*24-1);
    if(error) throw new Error("Missing destinations could not be loaded");
    const items=await withPhotoUrls(data,false);
    return {rows:items.flatMap(item=>missingDestinations(item).map(entry=>({...entry,item}))),count:count??0,itemPagination:true};
  }
  let query=supabase.from("marketplace_listings").select("*,inventory_items!inner(*,item_photos(*),marketplace_listings(*))",{count:"exact"}).eq("inventory_items.user_id",owner.id);
  if(view==="live") query=query.eq("status","live");
  if(view==="errors") query=query.eq("status","error");
  const {data,error,count}=await query.order("updated_at",{ascending:false}).order("id").range((page-1)*24,page*24-1);
  if(error) throw new Error("Listings could not be loaded");
  const items=await withPhotoUrls(data.map(row=>row.inventory_items),false);
  return {rows:data.map((listing,index)=>({listing,item:items[index],marketplace:listing.marketplace})),count:count??0,itemPagination:false};
}
export function pageNumber(value:string|undefined) { return value && /^\d+$/.test(value)?Math.max(1,Math.min(100000,Number(value))):1; }
