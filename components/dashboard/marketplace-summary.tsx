import Link from "next/link";
import { MarketplaceIdentity } from "@/components/marketplace-identity";
import { marketplaces } from "@/lib/listing/config";

export function MarketplaceSummary() {
  return <section className="rounded-lg border border-border bg-surface"><div className="border-b border-border px-4 py-3.5"><h2 className="text-sm font-semibold">Marketplace status</h2><p className="mt-0.5 text-xs text-muted-foreground">Connection placeholders · No live integrations</p></div><div className="divide-y divide-border px-4">{marketplaces.map(marketplace => <div key={marketplace.id} className="flex items-center justify-between gap-3 py-3 text-xs"><MarketplaceIdentity id={marketplace.id} /><span className="text-muted-foreground">Not connected</span></div>)}</div><div className="border-t border-border px-4 py-3"><Link href="/marketplaces" className="text-xs font-medium text-brand hover:underline">View marketplaces →</Link></div></section>;
}
