import Link from "next/link";
import { getSales, pageNumber } from "@/lib/inventory/records";
import { netProceeds } from "@/lib/inventory/sale";
import { date, money } from "@/lib/inventory/presentation";
import { PageHeader } from "@/components/page-header";
import { ItemPhoto } from "@/components/inventory/item-photo";
import { RecordPagination } from "@/components/inventory/record-pagination";

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = pageNumber((await searchParams).page);
  const { sales, count } = await getSales(page);
  return <div className="mx-auto max-w-[1480px] space-y-6">
    <PageHeader title="Sales" description={`${count} recorded sales. Approximate net proceeds are sale price minus fees and shipping; this is not profit or a full accounting report.`} />
    <p className="text-xs text-muted-foreground">Missing fees/shipping are treated as zero for the estimate. Dates are UTC. Manual entries are user-confirmed, not marketplace-verified.</p>
    <section className="overflow-x-auto rounded-lg border border-border bg-surface">
      {!sales.length ? <p className="p-6 text-sm text-muted-foreground">No sales recorded. Use Mark sold on an inventory item detail page.</p> : <table className="w-full min-w-[850px] text-left text-sm">
        <thead className="border-b border-border bg-surface-subtle text-xs text-muted-foreground"><tr>
          {["Item", "Channel", "Sale price", "Fees", "Shipping", "Approx. net", "Sold date"].map(label => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-border">{sales.map(sale => <tr key={sale.id}>
          <td className="px-4 py-4"><div className="flex items-center gap-3"><ItemPhoto url={sale.item.photos[0]?.url} title={sale.item.title} /><Link href={`/inventory/${sale.item.id}`} className="max-w-xs break-words font-medium text-brand hover:underline">{sale.item.title}</Link></div></td>
          <td className="px-4 py-3">{sale.sale_channel.replaceAll("_", " ")}</td>
          <td className="px-4 py-3 tabular-nums">{money(sale.sale_price)}</td>
          <td className="px-4 py-3 tabular-nums">{sale.marketplace_fees === null ? "Not entered" : money(sale.marketplace_fees)}</td>
          <td className="px-4 py-3 tabular-nums">{sale.shipping_cost === null ? "Not entered" : money(sale.shipping_cost)}</td>
          <td className="px-4 py-3 tabular-nums">{money(netProceeds(sale.sale_price, sale.marketplace_fees, sale.shipping_cost))}</td>
          <td className="whitespace-nowrap px-4 py-3">{date(sale.sold_at)}</td>
        </tr>)}</tbody>
      </table>}
    </section>
    <RecordPagination page={page} count={count} href="/sales" />
  </div>;
}
