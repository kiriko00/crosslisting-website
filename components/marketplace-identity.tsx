import Image from "next/image";
import { marketplaceIdentity, type MarketplaceKey } from "@/lib/marketplaces";

export function MarketplaceMark({ id, compact = false }: { id: MarketplaceKey; compact?: boolean }) {
  const identity = marketplaceIdentity[id];
  const wordmark = "wordmark" in identity && identity.wordmark;
  const width = wordmark ? (compact ? 24 : 40) : (compact ? 16 : 24);
  const height = compact ? 16 : 24;
  return <span style={{width,height}} className="inline-flex shrink-0 items-center justify-center" title={identity.logoKind === "fallback" ? `${identity.name}: temporary generic icon` : identity.name}>
    <Image src={identity.logo} width={width} height={height} unoptimized alt="" className="max-h-full max-w-full object-contain" />
  </span>;
}

export function MarketplaceIdentity({ id, compact = false }: { id: MarketplaceKey; compact?: boolean }) {
  return <span className="inline-flex items-center gap-2 align-middle"><MarketplaceMark id={id} compact={compact} /><span>{marketplaceIdentity[id].name}</span></span>;
}
