import { validMoney } from "../listing/validation";
import { uuidPattern } from "../listing/submission";
import type { Json } from "../supabase/database.types";

export function parseSale(value: unknown): { saleId: string; payload: Json } {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid sale data");
  const input = value as Record<string,unknown>;
  if (typeof input.saleId !== "string" || !uuidPattern.test(input.saleId)) throw new Error("Invalid sale request ID");
  const amounts: Record<string,number|null> = {};
  for (const key of ["sale_price","marketplace_fees","shipping_cost"] as const) {
    const raw = input[key];
    if (typeof raw !== "string" || !validMoney(raw,true) || (key==="sale_price" && !raw.trim()) || Number(raw) > 9999999999.99) throw new Error("Use valid non-negative money amounts with at most two decimals.");
    amounts[key] = raw === "" ? null : Number(raw);
  }
  const rawDate = input.sold_date;
  if (typeof rawDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) throw new Error("Choose a sold date (UTC).");
  const sold = new Date(`${rawDate}T00:00:00.000Z`);
  if (!Number.isFinite(sold.getTime()) || sold.toISOString().slice(0,10) !== rawDate || rawDate < "1900-01-01" || sold.getTime() > Date.now()) throw new Error("Choose a valid sold date, not in the future.");
  const listing = input.marketplace_listing_id;
  if (listing !== null && (typeof listing !== "string" || !uuidPattern.test(listing))) throw new Error("Choose a valid sale source");
  const channel = input.sale_channel;
  if (typeof channel !== "string" || !channel.trim() || channel.length > 120 || channel.includes("\u0000")) throw new Error("Enter a sale channel up to 120 characters.");
  return { saleId: input.saleId, payload: { ...amounts, marketplace_listing_id: listing, sale_channel: channel.trim(), sold_at: sold.toISOString() } };
}
export function netProceeds(price: number, fees: number | null, shipping: number | null) {
  return (Math.round(price*100) - Math.round((fees??0)*100) - Math.round((shipping??0)*100))/100;
}
