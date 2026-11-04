import { InventoryPageContent } from "@/components/inventory/inventory-page";

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  return <InventoryPageContent pageValue={(await searchParams).page} />;
}
