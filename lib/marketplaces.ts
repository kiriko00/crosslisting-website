// Shared visual identity only. Demo selection/readiness remains in listing/config.
export const marketplaceIdentity = {
  ebay: { name: "eBay", logo: "/marketplaces/ebay.svg", wordmark: true, logoKind: "brand", integrationStatus: "Demo · not connected" },
  depop: { name: "Depop", logo: "/marketplaces/depop.svg", wordmark: true, logoKind: "brand", integrationStatus: "Demo · not connected" },
  vinted: { name: "Vinted", logo: "/marketplaces/vinted.svg", logoKind: "brand", integrationStatus: "Demo · not connected" },
  etsy: { name: "Etsy", logo: "/marketplaces/etsy.svg", logoKind: "brand", integrationStatus: "Demo · not connected" },
  poshmark: { name: "Poshmark", logo: "/marketplaces/poshmark.png", logoKind: "brand", integrationStatus: "Demo · not connected" },
  grailed: { name: "Grailed", logo: "/marketplaces/fallback.svg", logoKind: "fallback", integrationStatus: "Demo · not connected" },
  facebook: { name: "Facebook Marketplace", logo: "/marketplaces/facebook.svg", logoKind: "brand", integrationStatus: "Demo · not connected" },
  mercari: { name: "Mercari", logo: "/marketplaces/fallback.svg", logoKind: "fallback", integrationStatus: "Demo · not connected" },
} as const;

export type MarketplaceKey = keyof typeof marketplaceIdentity;
