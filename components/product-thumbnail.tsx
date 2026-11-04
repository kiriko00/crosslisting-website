import type { ProductThumbnailKind } from "@/lib/types";

const backgrounds: Record<ProductThumbnailKind, string> = {
  "denim-jacket": "bg-[#e8eef2] text-[#476577]",
  sneakers: "bg-[#f0efeb] text-[#5d5a54]",
  "leather-bag": "bg-[#eee7df] text-[#6d4d39]",
  bracelet: "bg-[#f2eee2] text-[#8b733a]",
  "silk-scarf": "bg-[#eee9ed] text-[#77596c]",
};

export function ProductThumbnail({ kind }: { kind: ProductThumbnailKind }) {
  return (
    <div
      aria-hidden="true"
      className={`flex size-12 shrink-0 items-center justify-center rounded-md border border-black/5 ${backgrounds[kind]}`}
    >
      <ProductIllustration kind={kind} />
    </div>
  );
}

function ProductIllustration({ kind }: { kind: ProductThumbnailKind }) {
  const commonProps = {
    className: "size-9",
    fill: "none",
    viewBox: "0 0 48 48",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (kind === "denim-jacket") {
    return (
      <svg {...commonProps}>
        <path d="m17 9-7 5-5 11 7 3 3-5v16h18V23l3 5 7-3-5-11-7-5-3 4h-8l-3-4Z" />
        <path d="M20 13v26M28 13v26M15 23h18M19 27h4v4h-4zM25 27h4v4h-4z" />
      </svg>
    );
  }

  if (kind === "sneakers") {
    return (
      <svg {...commonProps}>
        <path d="M7 29c8 0 12-4 14-12l6 8 11 4c3 1 4 3 3 7H8c-3 0-4-5-1-7Z" />
        <path d="M9 31h31M22 21l5-2M24 24l6-2" />
      </svg>
    );
  }

  if (kind === "leather-bag") {
    return (
      <svg {...commonProps}>
        <path d="M9 18h30l-2 21H11L9 18Z" />
        <path d="M17 18v-3a7 7 0 0 1 14 0v3M10 24h28M20 28h8" />
      </svg>
    );
  }

  if (kind === "bracelet") {
    return (
      <svg {...commonProps}>
        <circle cx="24" cy="24" r="14" />
        <circle cx="24" cy="24" r="9" />
        <path d="M14 14l4 4m12-4-4 4m-12 12 4-4m12 4-4-4" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M12 10c7 2 17 1 24 0l2 26c-8-2-20-2-28 0l2-26Z" />
      <path d="m13 17 23 12M12 27l17-16M20 35l17-17" />
    </svg>
  );
}
