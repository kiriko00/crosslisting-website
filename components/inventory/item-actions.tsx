"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ItemStatus, MarketplaceListing } from "@/lib/supabase/database.types";
import { marketplaceIdentity } from "@/lib/marketplaces";
import { marketplaceKey } from "@/lib/inventory/presentation";
import { primaryButton, secondaryButton } from "@/components/listing/form-fields";

interface Props { id:string; title:string; revision:number; status:ItemStatus; sold:boolean; deleting:boolean; quantity:number; cleanupCount:number; listings:MarketplaceListing[] }
const inputStyle="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm focus:outline-2 focus:outline-brand";

export function ItemActions({id,title,revision,status,sold,deleting,quantity,cleanupCount,listings}:Props) {
  const router=useRouter();
  const [mode,setMode]=useState<"sale"|"archive"|"delete"|null>(deleting?"delete":null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const saving=useRef(false);
  const saleId=useRef<string|null>(null);
  async function perform(action:string,form?:FormData) {
    if(saving.current) return;
    saving.current=true; setBusy(true); setError("");
    const payload:Record<string,unknown>={action,revision};
    if(action==="sale" && form) {
      saleId.current??=crypto.randomUUID();
      const source=String(form.get("source"));
      Object.assign(payload,{saleId:saleId.current,marketplace_listing_id:source.startsWith("listing:")?source.slice(8):null,
        sale_channel:source==="other"?String(form.get("custom_channel")):source,
        sale_price:String(form.get("sale_price")),marketplace_fees:String(form.get("marketplace_fees")),shipping_cost:String(form.get("shipping_cost")),sold_date:String(form.get("sold_date"))});
    }
    if(action==="delete") payload.confirmation=String(form?.get("confirmation"));
    try {
      const response=await fetch(`/api/inventory/${id}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const result=await response.json();
      if(!response.ok) throw new Error(typeof result.error==="string"?result.error:"Action could not be confirmed. Reload before retrying.");
      if(action==="delete") router.push("/inventory?deleted=1");
      else { setMode(null); router.refresh(); }
    } catch(cause) { setError(cause instanceof Error?cause.message:"Action failed"); router.refresh(); }
    finally { saving.current=false; setBusy(false); }
  }
  return <section className="space-y-4 rounded-lg border border-border bg-surface p-5">
    <h2 className="text-sm font-semibold">Item actions</h2>
    {deleting ? <p className="text-sm text-amber-900">Deletion is paused/pending. Editing and sales are blocked until owned photo cleanup and deletion finish. Retry below; the item record has been retained.</p> : <div className="flex flex-wrap gap-3"><Link href={`/inventory/${id}/edit`} className={secondaryButton}>Edit listing</Link><button disabled={busy||sold} className={secondaryButton} onClick={()=>setMode("sale")}>Mark sold</button><button disabled={busy||status==="archived"} className={secondaryButton} onClick={()=>setMode("archive")}>Archive</button><button disabled={busy} className="px-2 text-xs font-medium text-red-700 underline" onClick={()=>setMode("delete")}>Permanently delete…</button></div>}
    {cleanupCount>0 ? <div className="flex flex-wrap items-center gap-3 text-xs text-amber-900"><p>{cleanupCount} unused photo cleanup {cleanupCount===1?"job":"jobs"} pending.</p><button disabled={busy} className="text-brand underline" onClick={()=>perform("cleanup")}>Retry photo cleanup</button></div> : null}
    {error ? <p role="alert" className="text-sm leading-6 text-red-700">{error}</p> : null}
    {mode ? <form onSubmit={event=>{event.preventDefault();perform(mode,new FormData(event.currentTarget));}}>
      <fieldset disabled={busy} className="space-y-4 border-t border-border pt-4">
        {mode==="sale" ? <>
          <h3 className="text-sm font-semibold">Record a manual sale</h3>
          <p className="text-xs leading-5 text-muted-foreground">This records your confirmation, not a marketplace API event. It marks the whole inventory record sold{quantity>1?` (all ${quantity} units; partial sales are not supported)`:""}. Other Ready/Live listings will require delisting; none will be claimed externally removed.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs font-medium">Sale channel<select name="source" required className={inputStyle}><option value="local">Local / in person</option><option value="manual">Manual sale</option><option value="off_platform">Off-platform sale</option>{listings.map(listing=><option key={listing.id} value={`listing:${listing.id}`}>{marketplaceIdentity[marketplaceKey(listing.marketplace)].name}</option>)}<option value="other">Other (specify below)</option></select></label>
            <label className="text-xs font-medium">Other channel (if selected)<input name="custom_channel" maxLength={120} className={inputStyle} /></label>
            <label className="text-xs font-medium">Sale price (USD)<input required name="sale_price" type="number" min="0" step="0.01" className={inputStyle} /></label>
            <label className="text-xs font-medium">Marketplace fees (optional, USD)<input name="marketplace_fees" type="number" min="0" step="0.01" className={inputStyle} /></label>
            <label className="text-xs font-medium">Shipping cost (optional, USD)<input name="shipping_cost" type="number" min="0" step="0.01" className={inputStyle} /></label>
            <label className="text-xs font-medium">Sold date (UTC)<input required name="sold_date" type="date" className={inputStyle} /></label>
          </div>
        </> : mode==="archive" ? <><h3 className="text-sm font-semibold">Archive this item?</h3><p className="text-sm text-muted-foreground">Keep the item, sale history, and photos, but remove it from normal inventory views. This does not remove any external listings. Archive is preferred over deletion.</p></> : <><h3 className="text-sm font-semibold text-red-700">Permanently delete {title}?</h3><p className="text-sm leading-6 text-muted-foreground">This permanently removes this item, its photos, marketplace records, and sale history. It cannot be undone and does not externally delist. Archive instead to retain history. External listings must be resolved first.</p><label className="block max-w-xs text-xs font-medium">Type DELETE to confirm<input required name="confirmation" pattern="DELETE" autoComplete="off" className={inputStyle} /></label></>}
        <div className="flex flex-wrap gap-3"><button className={mode==="delete"?`${primaryButton} bg-red-700 hover:bg-red-800`:primaryButton}>{busy?"Working…":mode==="sale"?"Confirm sale":mode==="archive"?"Confirm archive":"Delete permanently"}</button>{!deleting ? <button type="button" className={secondaryButton} onClick={()=>setMode(null)}>Cancel</button> : null}</div>
      </fieldset>
    </form> : null}
  </section>;
}
