import { emptyForm } from "./config";
import type { ListingFormState, MasterItem, Category } from "./types";
import type { InventoryItem, MarketplaceListing } from "../supabase/database.types";

export function hydrateListing(item: InventoryItem, listings: MarketplaceListing[]): ListingFormState {
  const form = emptyForm();
  const condition: Record<string,string> = { new_with_tags: "New with tags", new_without_tags: "New without tags", excellent: "Excellent", good: "Good", fair: "Fair" };
  const fields: Partial<Record<keyof MasterItem, keyof InventoryItem>> = {
    title:"title", description:"description", subcategory:"subcategory", brand:"brand", department:"department",
    size:"size", color:"color", material:"material", conditionNotes:"condition_notes", sku:"sku", measurements:"measurements",
    pattern:"pattern", style:"style", era:"era", country:"country_of_manufacture", price:"default_price",
    retailPrice:"original_retail_price", purchaseCost:"purchase_cost", quantity:"quantity", weight:"item_weight", shippingNotes:"shipping_notes",
  };
  for (const [key, column] of Object.entries(fields)) Object.assign(form.master, { [key]: item[column] === null ? "" : String(item[column]) });
  form.master.category = item.category ? (item.category.charAt(0).toUpperCase() + item.category.slice(1)) as Category : "";
  form.master.condition = item.condition ? condition[item.condition] ?? "" : "";
  for (const marketplace of item.selected_marketplaces) {
    const key = marketplace === "facebook_marketplace" ? "facebook" : marketplace;
    form.marketplaces[key].selected = true;
  }
  for (const listing of listings) {
    const key = listing.marketplace === "facebook_marketplace" ? "facebook" : listing.marketplace;
    const draft = form.marketplaces[key];
    draft.selected = true;
    if (listing.title_override !== null) draft.overrides.title = listing.title_override;
    if (listing.description_override !== null) draft.overrides.description = listing.description_override;
    if (listing.price_override !== null) draft.overrides.price = String(listing.price_override);
    if (listing.marketplace_specifics && typeof listing.marketplace_specifics === "object" && !Array.isArray(listing.marketplace_specifics)) {
      for (const [name,value] of Object.entries(listing.marketplace_specifics)) if (typeof value === "string") draft.specifics[name] = value;
    }
  }
  return form;
}
