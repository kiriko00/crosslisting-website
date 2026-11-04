import type { Marketplace, ListingStatus } from "../supabase/database.types";

export type Capability = "connect" | "create" | "update" | "delist" | "status" | "sales";
export type ConnectorAvailability = "Available" | "Planned" | "Partner access required" | "Restricted" | "Unsupported";
export interface ConnectorMetadata {
  marketplace: Marketplace;
  availability: ConnectorAvailability;
  description: string;
  priority: boolean;
  implemented: readonly Capability[];
  planned: readonly Capability[];
  documentation?: string;
}
export interface ConnectorContext { ownerId: string; connectionId: string }
export interface ConnectorSale { eventId: string; listingId: string; amount: number; soldAt: string }
// Optional methods reflect approved connector capabilities. A server-side
// connectionId resolves secure credentials later; this contract accepts no passwords.
export interface MarketplaceConnector {
  marketplace: Marketplace;
  connect?: (context: ConnectorContext) => Promise<{ authorizationUrl: string }>;
  createListing?: (context: ConnectorContext, input: { itemId: string; listingId: string }) => Promise<{ externalId: string }>;
  updateListing?: (context: ConnectorContext, listingId: string) => Promise<void>;
  delistListing?: (context: ConnectorContext, externalId: string) => Promise<{ confirmed: boolean }>;
  getListingStatus?: (context: ConnectorContext, externalId: string) => Promise<ListingStatus>;
  detectSales?: (context: ConnectorContext, cursor?: string) => Promise<{ sales: ConnectorSale[]; cursor?: string }>;
  verifySale?: (context: ConnectorContext, event: unknown) => Promise<ConnectorSale>;
}
