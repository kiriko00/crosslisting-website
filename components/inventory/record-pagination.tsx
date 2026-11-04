import Link from "next/link";
export function RecordPagination({page,count,href,itemPagination=false}:{page:number;count:number;href:string;itemPagination?:boolean}) {
  return count>24||page>1?<nav aria-label="Record pages" className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><p>{itemPagination?"Inventory scan page":"Page"} {page} of {Math.max(1,Math.ceil(count/24))}{itemPagination?" · 24 master items per page; some pages may have no missing destinations.":""}</p><div className="flex gap-4">{page>1?<Link className="text-brand underline" href={`${href}?page=${page-1}`}>Previous</Link>:null}{page*24<count?<Link className="text-brand underline" href={`${href}?page=${page+1}`}>Next</Link>:null}</div></nav>:null;
}
