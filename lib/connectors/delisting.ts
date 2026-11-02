import type { Marketplace } from "../supabase/database.types";
import type { ConnectorContext, MarketplaceConnector } from "./types";

export interface DelistingRequest { listingId: string; marketplace: Marketplace; externalId: string | null }
export type DelistingOutcome = { listingId: string; status: "required" | "succeeded" | "error"; message: string | null };

// Future worker boundary. No production adapter is registered in this milestone.
// A confirmed response is the ONLY path to succeeded. Persist each result before
// continuing; an adapter failure is isolated, but persistence failure must surface.
export async function requestDelisting(
  requests: DelistingRequest[],
  resolve: (marketplace: Marketplace) => { connector: MarketplaceConnector; context: ConnectorContext } | undefined,
  persist: (result: DelistingOutcome) => Promise<void>,
): Promise<DelistingOutcome[]> {
  const outcomes: DelistingOutcome[] = [];
  for (const request of requests) {
    let adapter: ReturnType<typeof resolve>;
    try { adapter = resolve(request.marketplace); } catch {
      const failed: DelistingOutcome = { listingId:request.listingId,status:"error",message:"Connector lookup failed. Other destinations can still proceed." };
      await persist(failed); outcomes.push(failed); continue;
    }
    let outcome: DelistingOutcome;
    if (!adapter?.connector.delistListing || adapter.connector.marketplace!==request.marketplace || !request.externalId) {
      outcome = { listingId: request.listingId, status: "required", message: "Not attempted: authorized connector or external listing ID unavailable." };
    } else {
      try {
        const result = await adapter.connector.delistListing(adapter.context, request.externalId);
        outcome = result.confirmed
          ? { listingId: request.listingId, status: "succeeded", message: null }
          : { listingId: request.listingId, status: "error", message: "Marketplace did not confirm delisting." };
      } catch {
        outcome = { listingId: request.listingId, status: "error", message: "Delisting failed. Retry this destination independently." };
      }
    }
    await persist(outcome);
    outcomes.push(outcome);
  }
  return outcomes;
}
