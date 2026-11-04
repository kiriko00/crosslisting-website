import { InventoryPageContent } from "@/components/inventory/inventory-page";

export default async function SoldInventoryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  return <InventoryPageContent status="sold" pageValue={(await searchParams).page} />;
}
