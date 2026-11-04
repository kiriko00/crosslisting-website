import { InventoryPageContent } from "@/components/inventory/inventory-page";
export default async function ArchivedPage({searchParams}:{searchParams:Promise<{page?:string}>}) {
  return <InventoryPageContent status="archived" pageValue={(await searchParams).page} />;
}
