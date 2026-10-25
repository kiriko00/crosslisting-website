// Hand-maintained against the version-controlled migrations; regenerate when
// the schema changes. No credentials or remote schema introspection required.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type ItemStatus = "draft" | "active" | "sold" | "archived";
export type Marketplace = "ebay" | "depop" | "vinted" | "etsy" | "poshmark" | "grailed" | "facebook_marketplace";
export type ListingStatus = "draft" | "ready" | "publishing" | "live" | "error" | "sold" | "delisted";

export type InventoryItem = {
  id: string; user_id: string; status: ItemStatus; title: string;
  description: string | null; category: string | null; subcategory: string | null;
  brand: string | null; department: string | null; size: string | null;
  color: string | null; material: string | null; condition: string | null;
  condition_notes: string | null; sku: string | null; measurements: string | null;
  pattern: string | null; style: string | null; era: string | null;
  country_of_manufacture: string | null; default_price: number | null;
  original_retail_price: number | null; purchase_cost: number | null;
  quantity: number; item_weight: number | null; shipping_notes: string | null;
  created_at: string; updated_at: string; sold_at: string | null;
};
export type MarketplaceListing = {
  id: string; item_id: string; marketplace: Marketplace; status: ListingStatus;
  external_listing_id: string | null; title_override: string | null;
  description_override: string | null; price_override: number | null;
  missing_fields: string[]; marketplace_specifics: Json; error_message: string | null;
  created_at: string; updated_at: string; published_at: string | null; sold_at: string | null;
};
export type ItemPhoto = { id: string; item_id: string; storage_path: string; sort_order: number; created_at: string };
export type Sale = {
  id: string; item_id: string; marketplace_listing_id: string | null;
  sale_channel: string; sale_price: number; marketplace_fees: number | null;
  shipping_cost: number | null; sold_at: string; created_at: string;
};
type Relation<Name extends string> = [{
  foreignKeyName: Name; columns: ["item_id"]; isOneToOne: false;
  referencedRelation: "inventory_items"; referencedColumns: ["id"];
}];
type Table<Row, Required extends keyof Row, Relationships = []> = {
  Row: Row; Insert: Pick<Row, Required> & Partial<Omit<Row, Required>>;
  Update: Partial<Row>; Relationships: Relationships;
};
export type Database = {
  public: {
    Tables: {
      inventory_items: Table<InventoryItem, "user_id" | "title">;
      marketplace_listings: Table<MarketplaceListing, "item_id" | "marketplace", Relation<"marketplace_listings_item_id_fkey">>;
      item_photos: Table<ItemPhoto, "item_id" | "storage_path" | "sort_order", Relation<"item_photos_item_id_fkey">>;
      sales: Table<Sale, "item_id" | "sale_channel" | "sale_price", Relation<"sales_item_id_fkey">>;
    };
    Views: { [_ in never]: never };
    Functions: {
      create_inventory_item: {
        Args: { p_id: string; p_master: Json; p_listings: Json; p_photos: Json };
        Returns: Json;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
