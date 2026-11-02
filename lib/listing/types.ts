export const categories = ["Clothing", "Footwear", "Bags", "Jewelry", "Accessories"] as const;
export type Category = (typeof categories)[number];
export type MarketplaceId = Exclude<import("../marketplaces").MarketplaceKey, "mercari">;
export interface MasterItem {
  title: string;
  description: string;
  category: Category | "";
  subcategory: string;
  brand: string;
  department: string;
  size: string;
  color: string;
  material: string;
  condition: string;
  conditionNotes: string;
  sku: string;
  measurements: string;
  pattern: string;
  style: string;
  era: string;
  country: string;
  price: string;
  retailPrice: string;
  purchaseCost: string;
  quantity: string;
  weight: string;
  shippingNotes: string;
}
export interface LocalPhoto {
  id: string;
  name: string;
  url: string;
  file?: File;
  storagePath?: string;
}
export type OverrideField = "title" | "description" | "price";
export interface MarketplaceDraft {
  selected: boolean;
  overrides: Partial<Record<OverrideField, string>>;
  specifics: Record<string, string>;
}
export type MarketplaceDrafts = Record<MarketplaceId, MarketplaceDraft>;
export interface ListingFormState {
  master: MasterItem;
  marketplaces: MarketplaceDrafts;
}
export type FieldErrors = Partial<Record<keyof MasterItem | "photos" | "marketplaces", string>>;
export interface MarketplaceRequirement {
  key: string;
  label: string;
  options: string[];
}
export interface MarketplaceConfig {
  id: MarketplaceId;
  name: string;
  description: string;
  requirements: MarketplaceRequirement[];
}
export interface ReadinessResult {
  id: MarketplaceId;
  status: "Ready" | "Draft";
  issues: string[];
}
