import Image from "next/image";

export function ItemPhoto({ url, title, unavailable = false, large = false }: { url?: string | null; title: string; unavailable?: boolean; large?: boolean }) {
  return <div className={`relative shrink-0 overflow-hidden rounded-md border border-border bg-surface-subtle ${large ? "aspect-square w-full" : "size-14"}`}>
    {url ? <Image src={url} alt={title} fill unoptimized sizes={large ? "480px" : "56px"} className="object-contain" /> : <span className="grid h-full place-items-center p-1 text-center text-[10px] text-muted-foreground">{unavailable ? "Photo unavailable" : "No photo"}</span>}
  </div>;
}
