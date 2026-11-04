import Link from "next/link";
import type { InventoryView } from "@/lib/inventory/queries";
import { date, statusLabels } from "@/lib/inventory/presentation";

export function ActivityFeed({ items }: { items: InventoryView[] }) {
  return <section className="rounded-lg border border-border bg-surface"><div className="border-b border-border px-4 py-3.5"><h2 className="text-sm font-semibold">Recent inventory activity</h2><p className="mt-0.5 text-xs text-muted-foreground">Latest saved item updates, not a complete event log</p></div>{items.length ? <ol className="divide-y divide-border px-4">{items.map(item => <li key={item.id} className="py-3"><Link href={`/inventory/${item.id}`} className="break-words text-xs font-medium text-brand hover:underline">{item.title}</Link><p className="mt-1 text-xs text-muted-foreground">{statusLabels[item.status]} item · Updated {date(item.updated_at)}</p></li>)}</ol> : <p className="p-4 text-xs text-muted-foreground">Activity will appear after you save inventory items.</p>}</section>;
}
