import type { MarketplaceKey } from "./marketplaces";

export type InventoryStatus = "Active" | "Draft" | "Sold" | "Archived";

export type ListingStatus =
  | "Draft"
  | "Ready"
  | "Publishing"
  | "Live"
  | "Error"
  | "Sold"
  | "Delisted";

export type ProductThumbnailKind =
  | "denim-jacket"
  | "sneakers"
  | "leather-bag"
  | "bracelet"
  | "silk-scarf";

export interface MockInventoryItem {
  id: string;
  sku: string;
  title: string;
  category: string;
  size: string;
  status: InventoryStatus;
  listingSummary: string;
  updatedAt: string;
  thumbnail: ProductThumbnailKind;
  attentionNote?: string;
  attentionMarketplace?: MarketplaceKey;
  saleMarketplace?: MarketplaceKey;
}

export interface MockMarketplaceSummary {
  id: string;
  marketplaceId: MarketplaceKey;
  connectionLabel: "Simulated" | "Not configured";
  liveListings: number;
  attentionCount: number;
  attentionLabel: string;
}

export type MockActivityKind = "inventory" | "listing" | "sale" | "error";

export interface MockActivity {
  id: string;
  kind: MockActivityKind;
  title: string;
  detail: string;
  occurredAt: string;
  marketplaceId?: MarketplaceKey;
}
