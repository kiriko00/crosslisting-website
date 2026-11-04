import { ListingsPageContent } from "@/components/inventory/listings-page";
export default async function Page({searchParams}:{searchParams:Promise<{page?:string}>}) {
  return <ListingsPageContent view="errors" pageValue={(await searchParams).page} />;
}
