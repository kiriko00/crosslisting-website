import { FormSection } from "./form-fields";
import { MarketplaceIdentity } from "@/components/marketplace-identity";
import { connectorMetadata } from "@/lib/connectors/config";
import { marketplaces } from "@/lib/listing/config";
import type { MarketplaceDrafts, MarketplaceId } from "@/lib/listing/types";

export function MarketplaceSelector({ drafts, toggle, error }: { drafts: MarketplaceDrafts; toggle: (id: MarketplaceId) => void; error?: string }) {
  return <FormSection title="Select marketplaces" required description="Select at least one destination. Account connection status is shown separately.">
    <p className="rounded-md border border-border bg-surface-subtle px-3 py-2 text-xs leading-5 text-muted-foreground">Selections and settings are saved to your inventory. No accounts are connected; external publishing and API availability are not implied.</p>
    {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
    <div className="divide-y divide-border border-y border-border">
      {marketplaces.map(config => <label key={config.id} className={`flex cursor-pointer items-center gap-3 px-3 py-4 ${drafts[config.id].selected ? "bg-brand-subtle/50" : "hover:bg-surface-subtle"}`}>
        <input type="checkbox" checked={drafts[config.id].selected} onChange={() => toggle(config.id)} className="size-4 shrink-0 accent-brand" />
        <span className="min-w-0 flex-1"><span className="block text-sm font-medium"><MarketplaceIdentity id={config.id} /></span><span className="block text-xs text-muted-foreground">{config.description}</span></span>
        <span className="max-w-36 text-right text-xs text-muted-foreground">{connectorMetadata[config.id==="facebook"?"facebook_marketplace":config.id].availability} · Not connected</span>
      </label>)}
    </div>
  </FormSection>;
}
