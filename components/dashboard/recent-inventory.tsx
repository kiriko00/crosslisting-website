import Link from "next/link";
import type { InventoryView } from "@/lib/inventory/queries";
import { InventoryList } from "@/components/inventory/inventory-list";

export function RecentInventory({ items }: { items: InventoryView[] }) {
  return <section className="overflow-hidden rounded-lg border border-border bg-surface"><div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5"><div><h2 className="text-sm font-semibold">Recent inventory</h2><p className="mt-0.5 text-xs text-muted-foreground">Your recently updated master items</p></div><Link href="/inventory" className="text-xs font-medium text-brand hover:underline">View all →</Link></div><InventoryList items={items} /></section>;
}
