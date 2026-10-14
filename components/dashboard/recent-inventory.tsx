import Link from "next/link";
import { Icon } from "@/components/icons";
import { ProductThumbnail } from "@/components/product-thumbnail";
import { StatusBadge } from "@/components/status-badge";
import { mockInventoryItems } from "@/lib/mock-data";
import type { MockInventoryItem } from "@/lib/types";
import { MarketplaceIdentity } from "@/components/marketplace-identity";

function ListingSummary({ item }: { item: MockInventoryItem }) {
  return <>{item.listingSummary}{item.saleMarketplace ? <> <MarketplaceIdentity id={item.saleMarketplace} compact /></> : null}</>;
}

function AttentionNote({ item }: { item: MockInventoryItem }) {
  return <>{item.attentionMarketplace ? <><MarketplaceIdentity id={item.attentionMarketplace} compact /> · </> : null}{item.attentionNote}</>;
}

export function RecentInventory() {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Recent inventory
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Recently updated master items and listing coverage
          </p>
        </div>
        <Link
          href="/inventory"
          className="flex items-center gap-1 text-xs font-medium text-brand outline-none hover:text-brand-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          View all
          <Icon name="chevron-right" className="size-3.5" />
        </Link>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead className="bg-surface-subtle">
            <tr className="border-b border-border text-[11px] font-medium text-muted-foreground">
              <th scope="col" className="px-5 py-2.5">Item</th>
              <th scope="col" className="px-4 py-2.5">Status</th>
              <th scope="col" className="px-4 py-2.5">Marketplace coverage</th>
              <th scope="col" className="px-5 py-2.5 text-right">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockInventoryItems.map((item) => (
              <tr key={item.id} className="hover:bg-surface-subtle/70">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <ProductThumbnail kind={item.thumbnail} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        <span className="font-mono">{item.sku}</span>
                        <span className="px-1.5">·</span>
                        {item.category}
                        <span className="px-1.5">·</span>
                        {item.size}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 align-middle">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 align-middle">
                  <p className="text-xs font-medium text-foreground">
                    <ListingSummary item={item} />
                  </p>
                  {item.attentionNote ? (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-700">
                      <Icon name="error" className="size-3" />
                      <AttentionNote item={item} />
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      No action needed
                    </p>
                  )}
                </td>
                <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                  {item.updatedAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border md:hidden">
        {mockInventoryItems.map((item) => (
          <article key={item.id} className="p-4">
            <div className="flex gap-3">
              <ProductThumbnail kind={item.thumbnail} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium leading-5 text-foreground">
                    {item.title}
                  </p>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  <span className="font-mono">{item.sku}</span>
                  <span className="px-1.5">·</span>
                  {item.size}
                </p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      <ListingSummary item={item} />
                    </p>
                    {item.attentionNote ? (
                      <p className="mt-0.5 text-[11px] leading-4 text-amber-700">
                        <AttentionNote item={item} />
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {item.updatedAt}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
