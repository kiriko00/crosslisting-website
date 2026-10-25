import Image from "next/image";
import { MarketplaceIdentity } from "@/components/marketplace-identity";
import { FormSection } from "./form-fields";
import { marketplaces } from "@/lib/listing/config";
import { effectiveListing, marketplaceIssues } from "@/lib/listing/validation";
import type { ListingFormState, LocalPhoto } from "@/lib/listing/types";

export function FinalReview({ form, photos }: { form: ListingFormState; photos: LocalPhoto[] }) {
  const selected = marketplaces.filter(config => form.marketplaces[config.id].selected);
  const ready = selected.filter(config => !marketplaceIssues(form, config, photos.length).length);
  return <FormSection title="Review & finish" description="Save the master item, private photos, and independent marketplace drafts/readiness states. Nothing will be sent to a marketplace.">
    <div className="flex items-start gap-4 border-b border-border pb-5">
      <figure className="shrink-0"><div className="relative size-24 overflow-hidden rounded-md border border-border bg-surface-subtle">{photos[0] ? <Image src={photos[0].url} alt={`Preview photo: ${photos[0].name}`} fill unoptimized sizes="96px" className="object-contain" /> : <span className="grid h-full place-items-center text-xs text-muted-foreground">No photo</span>}</div><figcaption className="mt-1 text-xs font-medium text-brand">Preview photo</figcaption></figure>
      <div className="min-w-0"><h3 className="break-words text-sm font-semibold">{form.master.title || "Untitled item"}</h3><p className="mt-1 text-xs text-muted-foreground">{[form.master.category, form.master.brand, form.master.size, form.master.condition].filter(Boolean).join(" · ")}</p><p className="mt-2 text-sm font-medium">Default price: {form.master.price ? `$${form.master.price} USD` : "Not set"}</p><p className="mt-1 text-xs text-muted-foreground">Quantity {form.master.quantity} · {photos.length} local {photos.length === 1 ? "photo" : "photos"}{form.master.sku ? ` · ${form.master.sku}` : ""}</p></div>
    </div>
    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{form.master.description}</p>
    <dl className="grid grid-cols-3 gap-3 border-y border-border py-4 text-sm"><div><dt className="text-xs text-muted-foreground">Selected</dt><dd className="mt-1 font-semibold">{selected.length}</dd></div><div><dt className="text-xs text-muted-foreground">Ready</dt><dd className="mt-1 font-semibold text-emerald-700">{ready.length}</dd></div><div><dt className="text-xs text-muted-foreground">Missing information</dt><dd className="mt-1 font-semibold text-amber-700">{selected.length - ready.length}</dd></div></dl>
    <div className="divide-y divide-border">{selected.map(config => {
      const issues = marketplaceIssues(form, config, photos.length);
      const effective = effectiveListing(form, config);
      return <div key={config.id} className="py-3"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-medium"><MarketplaceIdentity id={config.id} /></h3><span className={`text-xs font-medium ${issues.length ? "text-amber-700" : "text-emerald-700"}`}>{issues.length ? "Missing information" : "Ready (internal)"}</span></div><p className="mt-1 break-words text-xs text-muted-foreground">{effective.title} · ${effective.price} USD</p>{issues.length ? <ul className="mt-1 list-inside list-disc text-xs leading-5 text-amber-800">{issues.map(issue => <li key={issue}>{issue}</li>)}</ul> : null}</div>;
    })}</div>
    <p className="text-xs leading-5 text-muted-foreground">Both save actions persist a draft master item and all selected marketplace settings. Complete destinations are marked Ready internally; incomplete destinations remain Draft. Marketplace accounts must be connected through future integrations before external publishing becomes available.</p>
  </FormSection>;
}
