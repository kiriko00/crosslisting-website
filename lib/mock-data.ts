import type {
  MockActivity,
  MockInventoryItem,
  MockMarketplaceSummary,
} from "@/lib/types";

// Local, deterministic demo records. Nothing in this module is persisted or
// synchronized with an external marketplace.
export const dashboardMetrics = [
  {
    label: "Active items",
    value: 28,
    detail: "Across 39 mock live listings",
    tone: "neutral" as const,
  },
  {
    label: "Draft items",
    value: 6,
    detail: "3 updated this week",
    tone: "neutral" as const,
  },
  {
    label: "Sold items",
    value: 14,
    detail: "4 in the last 30 days",
    tone: "success" as const,
  },
  {
    label: "Listings needing attention",
    value: 5,
    detail: "3 errors · 2 missing",
    tone: "warning" as const,
  },
] as const;

export const mockInventoryItems: readonly MockInventoryItem[] = [
  {
    id: "item-1048",
    sku: "CL-1048",
    title: "Levi’s 70505 vintage denim jacket",
    category: "Outerwear",
    size: "M",
    status: "Active",
    listingSummary: "2 of 3 live",
    updatedAt: "12 min ago",
    thumbnail: "denim-jacket",
    attentionNote: "Needs category review",
    attentionMarketplace: "depop",
  },
  {
    id: "item-1047",
    sku: "CL-1047",
    title: "Common Projects Achilles low sneakers",
    category: "Footwear",
    size: "EU 42",
    status: "Active",
    listingSummary: "3 of 3 live",
    updatedAt: "1 hr ago",
    thumbnail: "sneakers",
  },
  {
    id: "item-1046",
    sku: "CL-1046",
    title: "Coach Legacy leather crossbody bag",
    category: "Bags",
    size: "One size",
    status: "Sold",
    listingSummary: "Sold via mock",
    saleMarketplace: "ebay",
    updatedAt: "Yesterday",
    thumbnail: "leather-bag",
  },
  {
    id: "item-1045",
    sku: "CL-1045",
    title: "14k gold rope-chain bracelet",
    category: "Jewelry",
    size: "7 in",
    status: "Draft",
    listingSummary: "0 of 2 ready",
    updatedAt: "Yesterday",
    thumbnail: "bracelet",
    attentionNote: "Add weight and clasp details",
  },
  {
    id: "item-1044",
    sku: "CL-1044",
    title: "Hermès printed silk scarf",
    category: "Accessories",
    size: "90 cm",
    status: "Active",
    listingSummary: "2 of 2 live",
    updatedAt: "Oct 4",
    thumbnail: "silk-scarf",
  },
];

export const mockMarketplaceSummaries: readonly MockMarketplaceSummary[] = [
  {
    id: "market-ebay",
    marketplaceId: "ebay",
    connectionLabel: "Simulated",
    liveListings: 18,
    attentionCount: 1,
    attentionLabel: "listing error",
  },
  {
    id: "market-poshmark",
    marketplaceId: "poshmark",
    connectionLabel: "Simulated",
    liveListings: 13,
    attentionCount: 2,
    attentionLabel: "missing listings",
  },
  {
    id: "market-depop",
    marketplaceId: "depop",
    connectionLabel: "Simulated",
    liveListings: 8,
    attentionCount: 2,
    attentionLabel: "listing errors",
  },
  {
    id: "market-mercari",
    marketplaceId: "mercari",
    connectionLabel: "Not configured",
    liveListings: 0,
    attentionCount: 0,
    attentionLabel: "",
  },
];

export const mockRecentActivity: readonly MockActivity[] = [
  {
    id: "activity-1",
    kind: "error",
    title: "Listing needs attention",
    detail: "Vintage denim jacket · Category review",
    marketplaceId: "depop",
    occurredAt: "12 min ago",
  },
  {
    id: "activity-2",
    kind: "inventory",
    title: "Master item added",
    detail: "Common Projects Achilles low sneakers",
    occurredAt: "1 hr ago",
  },
  {
    id: "activity-3",
    kind: "sale",
    title: "Mock sale recorded",
    detail: "Coach Legacy leather crossbody bag",
    marketplaceId: "ebay",
    occurredAt: "Yesterday",
  },
  {
    id: "activity-4",
    kind: "listing",
    title: "Mock listing moved to Live",
    detail: "Hermès printed silk scarf",
    marketplaceId: "poshmark",
    occurredAt: "Oct 4",
  },
];
