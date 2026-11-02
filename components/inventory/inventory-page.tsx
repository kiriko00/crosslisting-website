import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { InventoryList } from "./inventory-list";
import { getInventory } from "@/lib/inventory/queries";
import type { ItemStatus } from "@/lib/supabase/database.types";
import { primaryButton } from "@/components/listing/form-fields";

export async function InventoryPageContent({ status, pageValue }: { status?: ItemStatus; pageValue?: string }) {
  const page = pageValue && /^\d+$/.test(pageValue) ? Math.min(100000, Math.max(1, Number(pageValue))) : 1;
  const { items, count } = await getInventory(status, page);
  const base = status === "draft" ? "/inventory/drafts" : status === "sold" ? "/inventory/sold" : status==="archived"?"/inventory/archived":"/inventory";
  return <div className="mx-auto max-w-[1480px] space-y-6">
    <PageHeader title={status === "draft" ? "Draft inventory" : status === "sold" ? "Sold inventory" : status==="archived"?"Archived inventory":"All inventory"} description={`${count} ${count === 1 ? "item" : "items"} in this view. Normal views exclude archived and deletion-pending items.`} action={<Link href="/create-listing" className={primaryButton}>Create listing</Link>} />
    <nav aria-label="Inventory views" className="flex flex-wrap gap-4 text-sm text-brand">{[["All items","/inventory"],["Drafts","/inventory/drafts"],["Sold","/inventory/sold"],["Archived / deletion pending","/inventory/archived"]].map(([label,href])=><Link key={href} href={href} aria-current={base===href?"page":undefined} className={base===href?"font-semibold underline":"hover:underline"}>{label}</Link>)}</nav>
    <div className="overflow-hidden rounded-lg border border-border bg-surface"><InventoryList items={items} /></div>
    {count > 24 || page > 1 ? <nav aria-label="Inventory pages" className="flex items-center justify-between text-sm"><span>Page {page} of {Math.max(1, Math.ceil(count / 24))}</span><div className="flex gap-4">{page > 1 ? <Link className="text-brand underline" href={`${base}?page=${page - 1}`}>Previous</Link> : null}{page * 24 < count ? <Link className="text-brand underline" href={`${base}?page=${page + 1}`}>Next</Link> : null}</div></nav> : null}
  </div>;
}
