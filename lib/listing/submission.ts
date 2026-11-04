import { emptyForm, marketplaces } from "./config";
import { categories, type ListingFormState, type MasterItem } from "./types";
import { marketplaceIssues, validMoney, validateDetails, validatePricing } from "./validation";
import type { Json, Marketplace } from "../supabase/database.types";

export const PHOTO_BUCKET = "item-photos";
export const MAX_PHOTOS = 12;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const photoExtensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Validate untrusted JSON before mapping it to database fields. No client user_id
// or client-provided status is accepted. Drafts can be incomplete, not malformed.
export function parseSubmission(input: unknown, prepare: boolean, photoCount: number): ListingFormState {
  if (!object(input) || !object(input.master) || !object(input.marketplaces)) throw new Error("Invalid listing data. Reload the form and try again.");
  const form = emptyForm();
  for (const field of Object.keys(form.master) as (keyof MasterItem)[]) {
    const value = input.master[field];
    const limit = field === "description" || field === "measurements" || field === "shippingNotes" || field === "conditionNotes" ? 10000 : 300;
    if (typeof value !== "string" || value.length > limit || value.includes("\u0000")) throw new Error(`Check ${field}: use text up to ${limit} characters.`);
    // category is checked against its allowed values below.
    Object.assign(form.master, { [field]: value.trim() });
  }
  const master = form.master;
  if (!master.title) throw new Error("A title is required to save a draft.");
  if (master.category && !(categories as readonly string[]).includes(master.category)) throw new Error("Choose a valid category.");
  if (master.condition && !["New with tags", "New without tags", "Excellent", "Good", "Fair"].includes(master.condition)) throw new Error("Choose a valid condition.");
  for (const field of ["price", "retailPrice", "purchaseCost"] as const) {
    if (!validMoney(master[field], true) || Number(master[field]) > 9999999999.99) throw new Error(`Check ${field}: use a non-negative amount with at most two decimal places.`);
  }
  if (!/^\d+$/.test(master.quantity) || Number(master.quantity) < 1 || Number(master.quantity) > 2147483647) throw new Error("Quantity must be a positive whole number.");
  if (master.weight && (!/^\d+(\.\d{1,3})?$/.test(master.weight) || Number(master.weight) <= 0 || Number(master.weight) > 999999999.999)) throw new Error("Use a positive weight with at most three decimal places.");
  const allowed = new Set(marketplaces.map(config => config.id));
  if (Object.keys(input.marketplaces).some(key => !allowed.has(key as typeof marketplaces[number]["id"]))) throw new Error("Unknown marketplace selection.");
  for (const config of marketplaces) {
    const raw = input.marketplaces[config.id];
    if (!object(raw) || typeof raw.selected !== "boolean" || !object(raw.overrides) || !object(raw.specifics)) throw new Error("Invalid marketplace settings.");
    const draft = form.marketplaces[config.id];
    draft.selected = raw.selected;
    for (const field of ["title", "description", "price"] as const) {
      const value = raw.overrides[field];
      if (value === undefined) continue;
      if (typeof value !== "string" || value.length > (field === "description" ? 10000 : 300) || value.includes("\u0000")) throw new Error(`Invalid ${config.name} override.`);
      draft.overrides[field] = value.trim();
      if (field === "price" && draft.selected && (!value.trim() || !validMoney(value.trim(), true) || Number(value) > 9999999999.99)) throw new Error(`Enter a valid ${config.name} override price or restore the master value.`);
    }
    for (const requirement of config.requirements) {
      const value = raw.specifics[requirement.key];
      if (value === undefined || value === "") continue;
      if (typeof value !== "string" || !requirement.options.includes(value)) throw new Error(`Choose a valid ${config.name} ${requirement.label.toLowerCase()}.`);
      draft.specifics[requirement.key] = value;
    }
  }
  if (prepare) {
    if (Object.keys(validateDetails(master)).length || Object.keys(validatePricing(master)).length || photoCount === 0) throw new Error("Complete the required master details, pricing, and at least one photo before preparing listings.");
    if (!marketplaces.some(config => form.marketplaces[config.id].selected && marketplaceIssues(form, config, photoCount).length === 0)) throw new Error("Complete at least one marketplace's requirements before preparing listings.");
  }
  return form;
}

const conditionValues: Record<string, string> = {
  "New with tags": "new_with_tags", "New without tags": "new_without_tags",
  Excellent: "excellent", Good: "good", Fair: "fair",
};
const optional = (value: string) => value || null;
const amount = (value: string) => value === "" ? null : Number(value);

export function masterPayload(master: MasterItem): Json {
  return {
    title: master.title, description: optional(master.description),
    category: master.category ? master.category.toLowerCase() : null,
    subcategory: optional(master.subcategory), brand: optional(master.brand),
    department: optional(master.department), size: optional(master.size), color: optional(master.color),
    material: optional(master.material), condition: conditionValues[master.condition] ?? null,
    condition_notes: optional(master.conditionNotes), sku: optional(master.sku), measurements: optional(master.measurements),
    pattern: optional(master.pattern), style: optional(master.style), era: optional(master.era),
    country_of_manufacture: optional(master.country), default_price: amount(master.price),
    original_retail_price: amount(master.retailPrice), purchase_cost: amount(master.purchaseCost),
    quantity: Number(master.quantity), item_weight: amount(master.weight), shipping_notes: optional(master.shippingNotes),
  };
}

export function listingPayload(form: ListingFormState, photoCount: number): Json[] {
  return marketplaces.filter(config => form.marketplaces[config.id].selected).map(config => {
    const draft = form.marketplaces[config.id];
    const issues = marketplaceIssues(form, config, photoCount);
    const missing = [
      ...(!((draft.overrides.title ?? form.master.title).trim()) ? ["title"] : []),
      ...(!((draft.overrides.description ?? form.master.description).trim()) ? ["description"] : []),
      ...(!validMoney(draft.overrides.price ?? form.master.price) ? ["price"] : []),
      ...(!form.master.category ? ["category"] : []), ...(!form.master.condition ? ["condition"] : []),
      ...(photoCount === 0 ? ["photos"] : []),
      ...config.requirements.filter(field => !field.options.includes(draft.specifics[field.key])).map(field => field.key),
    ];
    const marketplace: Marketplace = config.id === "facebook" ? "facebook_marketplace" : config.id;
    return {
      marketplace, status: issues.length ? "draft" : "ready",
      title_override: draft.overrides.title ?? null, description_override: draft.overrides.description ?? null,
      price_override: draft.overrides.price === undefined ? null : Number(draft.overrides.price),
      missing_fields: missing, marketplace_specifics: draft.specifics,
    };
  });
}

export async function validatePhoto(file: File) {
  if (!Object.hasOwn(photoExtensions, file.type) || file.size <= 0 || file.size > MAX_PHOTO_BYTES) throw new Error("Use JPEG, PNG, or WebP photos no larger than 10 MB each.");
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!(file.type === "image/jpeg" ? jpeg : file.type === "image/png" ? png : webp)) throw new Error("A photo's contents do not match its image type. Export it again as JPEG, PNG, or WebP.");
}
