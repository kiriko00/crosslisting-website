import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";

// Shared sale boundary for today's manual confirmation and future verified
// connector events. The database commits the sale, sold states, and per-listing
// delisting requirements together. External workers run only after that commit.
export async function recordSaleAndRequireDelisting(client:SupabaseClient<Database>, input:{itemId:string;saleId:string;revision:number;payload:Json}) {
  const identity=await client.auth.getClaims();
  if(identity.error || !identity.data?.claims.sub) throw new Error("Sign in again before recording a sale.");
  const {data,error}=await client.rpc("record_inventory_sale",{p_id:input.itemId,p_sale_id:input.saleId,p_revision:input.revision,p_sale:input.payload});
  if(error || !data || typeof data!=="object" || Array.isArray(data) || data.id!==input.saleId) throw new Error(error?.code==="40001"?"This item changed or already has a sale. Reload first.":"Sale was not confirmed. Check Sales before retrying this same request.");
  return {saleId:input.saleId};
}
