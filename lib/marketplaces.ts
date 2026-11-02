// Shared visual identity only. Connector availability is in connectors/config.
export const marketplaceIdentity = {
  ebay: { name: "eBay", logo: "/marketplaces/ebay.svg", wordmark: true, logoKind: "brand" },
  depop: { name: "Depop", logo: "/marketplaces/depop.svg", wordmark: true, logoKind: "brand" },
  vinted: { name: "Vinted", logo: "/marketplaces/vinted.svg", logoKind: "brand" },
  etsy: { name: "Etsy", logo: "/marketplaces/etsy.svg", logoKind: "brand" },
  poshmark: { name: "Poshmark", logo: "/marketplaces/poshmark.png", logoKind: "brand" },
  grailed: { name: "Grailed", logo: "/marketplaces/fallback.svg", logoKind: "fallback" },
  facebook: { name: "Facebook Marketplace", logo: "/marketplaces/facebook.svg", logoKind: "brand" },
  mercari: { name: "Mercari", logo: "/marketplaces/fallback.svg", logoKind: "fallback" },
} as const;

export type MarketplaceKey = keyof typeof marketplaceIdentity;
