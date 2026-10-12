import type { Category, ListingFormState, MarketplaceConfig, MarketplaceDrafts } from "./types";

// Illustrative demo rules only. These are not verified marketplace API policies.
export const marketplaces: readonly MarketplaceConfig[] = [
  { id: "ebay", name: "eBay", description: "Broad resale catalog", requirements: [] },
  { id: "depop", name: "Depop", description: "Fashion and vintage", requirements: [] },
  { id: "vinted", name: "Vinted", description: "Secondhand fashion", requirements: [{ key: "parcelSize", label: "Parcel size", options: ["Small", "Medium", "Large"] }] },
  { id: "etsy", name: "Etsy", description: "Vintage and eligible goods", requirements: [{ key: "eligibility", label: "Item eligibility", options: ["Vintage (20+ years)", "Handmade", "Craft supply"] }] },
  { id: "poshmark", name: "Poshmark", description: "Fashion resale", requirements: [] },
  { id: "grailed", name: "Grailed", description: "Designer and streetwear", requirements: [{ key: "shippingRegion", label: "Shipping region", options: ["Domestic only", "Domestic and international"] }] },
  { id: "facebook", name: "Facebook Marketplace", description: "Local resale", requirements: [{ key: "fulfillment", label: "Fulfillment preference", options: ["Local pickup", "Shipping", "Pickup or shipping"] }] },
];

export const categoryConfig: Record<Category, { subcategories: string[]; sizeLabel: string; measurementHint: string }> = {
  Clothing: { subcategories: ["Outerwear", "Tops", "Bottoms", "Dresses", "Knitwear"], sizeLabel: "Size", measurementHint: "e.g. Chest 22 in flat; length 25 in; sleeve 24 in" },
  Footwear: { subcategories: ["Sneakers", "Boots", "Flats", "Heels", "Sandals"], sizeLabel: "Shoe size / system", measurementHint: "e.g. Insole 27 cm; heel height 3 cm" },
  Bags: { subcategories: ["Crossbody", "Shoulder bags", "Totes", "Backpacks", "Clutches"], sizeLabel: "Size / dimensions", measurementHint: "e.g. Width 10 in; height 7 in; strap drop 20 in" },
  Jewelry: { subcategories: ["Bracelets", "Necklaces", "Rings", "Earrings", "Watches"], sizeLabel: "Length / ring size", measurementHint: "e.g. Length 7 in; chain width 3 mm" },
  Accessories: { subcategories: ["Scarves", "Belts", "Hats", "Sunglasses", "Other"], sizeLabel: "Size", measurementHint: "e.g. Scarf 90 × 90 cm; belt length 34 in" },
};

export function emptyForm(): ListingFormState {
  return {
    master: {
      title: "", description: "", category: "", subcategory: "", brand: "", department: "", size: "", color: "", material: "", condition: "", conditionNotes: "", sku: "", measurements: "", pattern: "", style: "", era: "", country: "", price: "", retailPrice: "", purchaseCost: "", quantity: "1", weight: "", shippingNotes: "",
    },
    marketplaces: Object.fromEntries(marketplaces.map(({ id }) => [id, { selected: false, overrides: {}, specifics: {} }])) as MarketplaceDrafts,
  };
}

export function exampleForm(): ListingFormState {
  const form = emptyForm();
  form.master = { ...form.master, title: "Levi’s 70505 vintage denim jacket", description: "Vintage Levi’s denim trucker jacket in a washed indigo finish. Original button hardware and two chest pockets. Light fading at the seams; no holes. See measurements for fit.", category: "Clothing", subcategory: "Outerwear", brand: "Levi’s", department: "Unisex", size: "M", color: "Indigo", material: "Cotton denim", condition: "Good", conditionNotes: "Light fading at seams.", sku: "CL-1049", measurements: "Chest 22 in flat; length 25 in; sleeve 24 in", style: "Trucker jacket", era: "1990s", price: "85.00", quantity: "1" };
  for (const id of ["ebay", "depop", "vinted"] as const) form.marketplaces[id].selected = true;
  return form;
}
