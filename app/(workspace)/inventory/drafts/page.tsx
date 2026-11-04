import { InventoryPageContent } from "@/components/inventory/inventory-page";

export default async function InventoryDraftsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  return <InventoryPageContent status="draft" pageValue={(await searchParams).page} />;
}
