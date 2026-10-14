import Link from "next/link";
import { Icon } from "@/components/icons";
import { MarketplaceIdentity } from "@/components/marketplace-identity";
import { mockMarketplaceSummaries } from "@/lib/mock-data";

export function MarketplaceSummary() {
  return (
    <section className="rounded-lg border border-border bg-surface">
      <div className="border-b border-border px-4 py-3.5">
        <h2 className="text-sm font-semibold text-foreground">
          Marketplace status
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Simulated connections and listing health
        </p>
      </div>

      <div className="divide-y divide-border px-4">
        {mockMarketplaceSummaries.map((marketplace) => (
          <div
            key={marketplace.id}
            className="flex items-center gap-3 py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-foreground">
                  <MarketplaceIdentity id={marketplace.marketplaceId} />
                </p>
                <span
                  className={`text-[11px] font-medium ${
                    marketplace.connectionLabel === "Simulated"
                      ? "text-emerald-700"
                      : "text-muted-foreground"
                  }`}
                >
                  {marketplace.connectionLabel}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 text-[11px]">
                <span className="text-muted-foreground">
                  {marketplace.liveListings} mock live
                </span>
                {marketplace.attentionCount > 0 ? (
                  <span className="text-amber-700">
                    {marketplace.attentionCount} {marketplace.attentionLabel}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border px-4 py-3">
        <Link
          href="/marketplaces"
          className="flex items-center gap-1 text-xs font-medium text-brand outline-none hover:text-brand-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          View marketplaces
          <Icon name="chevron-right" className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}
