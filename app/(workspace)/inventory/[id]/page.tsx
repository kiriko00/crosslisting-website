import Link from "next/link";
import { getItem, getCleanupCount } from "@/lib/inventory/queries";
import { date, marketplaceKey, money, statusLabels } from "@/lib/inventory/presentation";
import { PageHeader } from "@/components/page-header";
import { ItemPhoto } from "@/components/inventory/item-photo";
import { StatusBadge } from "@/components/status-badge";
import { MarketplaceIdentity } from "@/components/marketplace-identity";
import { ItemActions } from "@/components/inventory/item-actions";

export default async function ItemDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; warning?: string }> }) {
  const item = await getItem((await params).id);
  const cleanupCount=await getCleanupCount(item.id);
  const feedback = await searchParams;
  const attributes = [
    ["Category", item.category], ["Subcategory", item.subcategory], ["Brand", item.brand],
    ["Department", item.department], ["Size", item.size], ["Color", item.color], ["Material", item.material],
    ["Condition", item.condition?.replaceAll("_", " ")], ["Condition notes", item.condition_notes],
    ["SKU", item.sku], ["Measurements", item.measurements], ["Pattern", item.pattern], ["Style", item.style],
    ["Era", item.era], ["Country of manufacture", item.country_of_manufacture],
    ["Default price (USD)", money(item.default_price)], ["Original retail price (USD)", money(item.original_retail_price)],
    ["Purchase cost (private, USD)", money(item.purchase_cost)], ["Quantity", String(item.quantity)],
    ["Weight (lb)", item.item_weight === null ? null : String(item.item_weight)], ["Shipping notes", item.shipping_notes],
  ];
  return <div className="mx-auto max-w-[1200px] space-y-6">
    <Link href="/inventory" className="text-xs font-medium text-brand underline">← All inventory</Link>
    <PageHeader title={item.title} description={`Created ${date(item.created_at)} · Updated ${date(item.updated_at)}`} />
    {feedback.saved === "1" ? <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Your item is saved to your account. Marketplace listings are saved internally only; nothing was published externally.</p> : null}
    {feedback.warning === "cleanup" ? <p role="alert" className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">The item is saved, but unused uploads from a duplicate attempt could not be removed. See the private-file cleanup notes in the setup guide.</p> : null}
    <div className="flex flex-wrap items-center gap-3"><StatusBadge status={statusLabels[item.status]} />{item.sold_at ? <p className="text-xs text-muted-foreground">Sold {date(item.sold_at)}</p> : null}<p className="text-xs text-muted-foreground">No external marketplaces connected</p></div>
    <ItemActions id={item.id} title={item.title} revision={item.revision} status={item.status} sold={Boolean(item.sold_at)} deleting={item.deletion_pending} quantity={item.quantity} cleanupCount={cleanupCount} listings={item.marketplace_listings} />
    {item.marketplace_listings.some(listing=>["required","pending","error"].includes(listing.delisting_status)) ? <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><h2 className="font-semibold">Delisting needs attention</h2><ul className="mt-2 list-inside list-disc">{item.marketplace_listings.filter(listing=>["required","pending","error"].includes(listing.delisting_status)).map(listing=><li key={listing.id}>{listing.marketplace}: {listing.delisting_status} · {listing.delisting_error || "External removal is not confirmed."}</li>)}</ul><p className="mt-2 text-xs">No external calls were made. Ready-only records may not exist externally; verify any actual marketplace listings manually.</p></section> : null}
    <section aria-label="Item photos" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{item.photos.length ? item.photos.map((photo, index) => <figure key={photo.id}><ItemPhoto large url={photo.url} title={`${item.title}, photo ${index + 1}`} unavailable /><figcaption className="mt-1 text-xs text-muted-foreground">{index === 0 ? "Preview photo" : `Photo ${index + 1}`}</figcaption></figure>) : <p className="col-span-full text-sm text-muted-foreground">No photos saved yet.</p>}</section>
    <section className="rounded-lg border border-border bg-surface p-5"><h2 className="text-sm font-semibold">Master item</h2><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{item.description || "No description added."}</p><dl className="mt-5 grid gap-x-6 gap-y-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-3">{attributes.map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{value || "Not set"}</dd></div>)}</dl></section>
    <section className="overflow-hidden rounded-lg border border-border bg-surface"><div className="border-b border-border p-5"><h2 className="text-sm font-semibold">Marketplace listings</h2><p className="mt-1 text-xs text-muted-foreground">Readiness uses illustrative rules, not verified marketplace API requirements. Ready does not mean published.</p></div><div className="divide-y divide-border">{item.marketplace_listings.length ? item.marketplace_listings.map(listing => <article key={listing.id} className="space-y-3 p-5"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-medium"><MarketplaceIdentity id={marketplaceKey(listing.marketplace)} /></h3><StatusBadge status={statusLabels[listing.status]} /></div><p className="break-words text-sm">{listing.title_override ?? item.title} <span className="text-xs text-muted-foreground">({listing.title_override === null ? "master title" : "custom title"})</span></p><p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{listing.description_override ?? item.description ?? "No description"}</p><p className="text-xs">{money(listing.price_override ?? item.default_price)} · {listing.price_override === null ? "Master price" : "Custom price"}</p>{listing.missing_fields.length ? <p className="text-xs leading-5 text-amber-800">Missing: {listing.missing_fields.join(", ")}</p> : null}{listing.error_message ? <p className="text-xs text-red-700">{listing.error_message}</p> : null}{listing.marketplace_specifics && typeof listing.marketplace_specifics === "object" && !Array.isArray(listing.marketplace_specifics) ? <dl className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">{Object.entries(listing.marketplace_specifics).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{typeof value === "string" ? value : "Not set"}</dd></div>)}</dl> : null}</article>) : <p className="p-5 text-sm text-muted-foreground">No marketplaces selected for this item.</p>}</div></section>
  </div>;
}
