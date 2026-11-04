import type { InventoryItem, MarketplaceListing } from "../supabase/database.types";

export function missingDestinations(item:Pick<InventoryItem,"selected_marketplaces"> & {marketplace_listings:MarketplaceListing[]}) {
  return [...new Set(item.selected_marketplaces)].flatMap(marketplace=>{
    const listing=item.marketplace_listings.find(row=>row.marketplace===marketplace)??null;
    return !listing || listing.missing_fields.length || !["live","sold"].includes(listing.status) ? [{marketplace,listing}] : [];
  });
}
