import Link from "next/link";
import { MarketplaceIdentity } from "@/components/marketplace-identity";
import { connectorMetadata,connectorOrder } from "@/lib/connectors/config";
import { marketplaceKey } from "@/lib/inventory/presentation";

export function MarketplaceSummary() {
  return <section className="rounded-lg border border-border bg-surface"><div className="border-b border-border px-4 py-3.5"><h2 className="text-sm font-semibold">Marketplace status</h2><p className="mt-0.5 text-xs text-muted-foreground">No implemented or connected adapters</p></div><div className="divide-y divide-border px-4">{connectorOrder.map(key => <div key={key} className="flex items-center justify-between gap-3 py-3 text-xs"><MarketplaceIdentity id={marketplaceKey(key)} /><span className="text-right text-muted-foreground">{connectorMetadata[key].availability}<span className="block text-[10px]">Not connected</span></span></div>)}</div><div className="border-t border-border px-4 py-3"><Link href="/marketplaces" className="text-xs font-medium text-brand hover:underline">View marketplaces →</Link></div></section>;
}
