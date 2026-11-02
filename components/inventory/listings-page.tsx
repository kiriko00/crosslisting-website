import Link from "next/link";
import { getListings, pageNumber } from "@/lib/inventory/records";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { MarketplaceIdentity } from "@/components/marketplace-identity";
import { marketplaceKey,statusLabels } from "@/lib/inventory/presentation";
import { ItemPhoto } from "./item-photo";
import { RecordPagination } from "./record-pagination";

export async function ListingsPageContent({view,pageValue}:{view:"all"|"live"|"missing"|"errors";pageValue?:string}) {
  const page=pageNumber(pageValue); const {rows,count,itemPagination}=await getListings(view,page);
  const href=view==="all"?"/listings":`/listings/${view}`;
  return <div className="mx-auto max-w-[1400px] space-y-6">
    <PageHeader title={view==="all"?"Marketplace listings":view==="live"?"Live listings":view==="missing"?"Missing listings":"Listing errors"} description="These are real internal records. External publishing/status verification is unavailable; Ready is not Live, and a stored Live value is not fresh marketplace confirmation." />
    <nav aria-label="Listing views" className="flex flex-wrap gap-4 text-sm text-brand">{[["All","/listings"],["Live","/listings/live"],["Missing","/listings/missing"],["Errors","/listings/errors"]].map(([label,path])=><Link aria-current={href===path?"page":undefined} key={path} href={path} className={href===path?"font-semibold underline":"hover:underline"}>{label}</Link>)}</nav>
    {view==="missing"?<p className="text-xs leading-5 text-muted-foreground">Scans selected destinations on non-sold, non-archived items: no record, missing information, or no stored Live listing. Ready-only destinations are unpublished, not evidence of an external listing.</p>:null}
    <section className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {!rows.length?<p className="p-6 text-sm text-muted-foreground">{itemPagination?"No missing destinations in this inventory page. Check other pages if available.":"No matching listing records."}</p>:rows.map(({item,listing,marketplace})=><article key={`${item.id}:${marketplace}`} className="space-y-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><ItemPhoto url={item.photos[0]?.url} title={item.title} /><div className="min-w-0"><Link href={`/inventory/${item.id}`} className="break-words text-sm font-semibold text-brand hover:underline">{item.title}</Link><div className="mt-1 text-xs"><MarketplaceIdentity id={marketplaceKey(marketplace)} /></div></div></div>{listing?<StatusBadge status={statusLabels[listing.status]} />:<span className="text-xs font-medium text-amber-800">No listing record</span>}</div>
        <p className="text-xs text-muted-foreground">{listing?.external_listing_id?"An external ID is stored, but no connector is available to verify its current status.":"No external listing identity is recorded. Nothing has been published by this app."}</p>
        {listing?.missing_fields.length?<p className="text-xs text-amber-800">Missing information: {listing.missing_fields.join(", ")}</p>:null}
        {listing?.error_message?<p className="whitespace-pre-wrap break-words text-sm text-red-700">{listing.error_message}</p>:view==="errors"?<p className="text-xs text-red-700">No error detail was stored.</p>:null}
        {listing && ["required","pending","error"].includes(listing.delisting_status)?<p className="text-xs text-amber-900">Delisting {listing.delisting_status}: {listing.delisting_error||"External removal has not been confirmed."}</p>:null}
        {!item.deletion_pending?<Link href={`/inventory/${item.id}/edit`} className="inline-block text-xs font-medium text-brand underline">Review item and marketplace settings</Link>:null}
      </article>)}
    </section>
    <RecordPagination page={page} count={count} href={href} itemPagination={itemPagination} />
  </div>;
}
