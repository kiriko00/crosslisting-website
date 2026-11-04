import Link from "next/link";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { MarketplaceSummary } from "@/components/dashboard/marketplace-summary";
import { RecentInventory } from "@/components/dashboard/recent-inventory";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { getDashboardCounts, getInventory } from "@/lib/inventory/queries";

export default async function DashboardPage() {
  const [counts, { items }] = await Promise.all([getDashboardCounts(), getInventory(undefined, 1, 5, true)]);
  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6">
      <PageHeader
        title="Dashboard"
        description="Monitor inventory health, marketplace coverage, and work that needs your attention."
        action={
          <Link
            href="/create-listing"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-white outline-none transition-colors hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <Icon name="plus" className="size-4" />
            Create listing
          </Link>
        }
      />

      <div className="flex items-start gap-3 rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sky-900">
        <Icon name="spark" className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="text-xs font-semibold">Your private inventory</p>
          <p className="mt-0.5 text-xs leading-5 text-sky-800">
            Inventory, saved listing states, and counts come from your account.
            Marketplace connections remain placeholders. Nothing is published externally.
          </p>
        </div>
      </div>

      <DashboardStats counts={counts} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.7fr)]">
        <RecentInventory items={items} />
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
          <MarketplaceSummary />
          <ActivityFeed items={items} />
        </div>
      </div>
    </div>
  );
}
