import { getItem } from "@/lib/inventory/queries";
import { hydrateListing } from "@/lib/listing/hydrate";
import { ListingWorkflow } from "@/components/listing/listing-workflow";
import Link from "next/link";

export default async function EditPage({params}:{params:Promise<{id:string}>}) {
  const item=await getItem((await params).id);
  if(item.deletion_pending) return <p className="text-sm">Deletion is pending. <Link href={`/inventory/${item.id}`} className="text-brand underline">Retry cleanup from the item page.</Link></p>;
  return <ListingWorkflow key={`${item.id}:${item.revision}`} initial={{id:item.id,revision:item.revision,form:hydrateListing(item,item.marketplace_listings),listings:item.marketplace_listings,photos:item.photos.map((photo,index)=>({id:photo.id,name:`Saved photo ${index+1}`,url:photo.url??"",storagePath:photo.storage_path}))}} />;
}
