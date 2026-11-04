import Link from "next/link";
export default function ItemNotFound() {
  return <section className="space-y-3 py-8"><h1 className="text-2xl font-semibold">Item not found</h1><p className="text-sm text-muted-foreground">This item does not exist or is not available in your inventory.</p><Link href="/inventory" className="text-sm text-brand underline">Back to inventory</Link></section>;
}
