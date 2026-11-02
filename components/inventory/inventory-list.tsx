import Link from "next/link";
import type { InventoryView } from "@/lib/inventory/queries";
import { date, marketplaceKey, money, statusLabels } from "@/lib/inventory/presentation";
import { MarketplaceIdentity } from "@/components/marketplace-identity";
import { StatusBadge } from "@/components/status-badge";
import { ItemPhoto } from "./item-photo";

export function InventoryList({ items }: { items: InventoryView[] }) {
  if (!items.length) return <div className="p-6"><p className="text-sm font-medium">No inventory items in this view</p><p className="mt-1 text-sm text-muted-foreground">Save your first item to start building your inventory.</p><Link className="mt-4 inline-block text-sm font-medium text-brand underline" href="/create-listing">Create listing</Link></div>;
  return <div className="divide-y divide-border">{items.map(item => <article key={item.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
    <div className="flex min-w-0 flex-1 items-center gap-3"><ItemPhoto url={item.photos[0]?.url} title={item.title} unavailable={item.photos.length > 0} /><div className="min-w-0"><Link className="break-words text-sm font-semibold text-brand hover:underline" href={`/inventory/${item.id}`}>{item.title}</Link><p className="mt-1 text-xs text-muted-foreground">{[item.brand, item.size, item.sku].filter(Boolean).join(" · ") || "Product details not added"}</p><p className="mt-1 text-[11px] text-muted-foreground">Created {date(item.created_at)}</p></div></div>
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-4 sm:w-[45%]">
      <div className="space-y-1 text-xs">{item.marketplace_listings.length ? item.marketplace_listings.map(listing => <p key={listing.id}><MarketplaceIdentity id={marketplaceKey(listing.marketplace)} compact /> <span className={listing.missing_fields.length || listing.status === "error" ? "text-amber-800" : "text-muted-foreground"}>· {statusLabels[listing.status]}{listing.missing_fields.length ? " · Needs information" : ""}</span></p>) : <p className="text-muted-foreground">No marketplaces selected</p>}</div>
      <div className="shrink-0 text-right"><StatusBadge status={statusLabels[item.status]} />{item.deletion_pending?<p className="mt-1 text-xs text-red-700">Deletion pending · retry from item</p>:null}<p className="mt-2 text-sm font-medium">{money(item.default_price)}</p></div>
    </div>
  </article>)}</div>;
}
