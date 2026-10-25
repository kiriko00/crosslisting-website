import type { ItemStatus, ListingStatus, Marketplace } from "@/lib/supabase/database.types";
import type { MarketplaceKey } from "@/lib/marketplaces";

export const statusLabels: Record<ItemStatus | ListingStatus, "Draft" | "Active" | "Sold" | "Archived" | "Ready" | "Publishing" | "Live" | "Error" | "Delisted"> = {
  draft: "Draft", active: "Active", sold: "Sold", archived: "Archived", ready: "Ready",
  publishing: "Publishing", live: "Live", error: "Error", delisted: "Delisted",
};
export function marketplaceKey(value: Marketplace): MarketplaceKey {
  return value === "facebook_marketplace" ? "facebook" : value;
}
export function money(value: number | null) {
  return value === null ? "Not set" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}
export function date(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}
