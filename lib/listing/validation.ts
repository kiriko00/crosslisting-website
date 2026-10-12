import { marketplaces } from "./config";
import type { FieldErrors, ListingFormState, MarketplaceConfig, MasterItem, PublishResult } from "./types";

export function validMoney(value: string, optional = false): boolean {
  if (!value.trim()) return optional;
  return /^\d+(\.\d{1,2})?$/.test(value) && Number.isFinite(Number(value)) && (optional ? Number(value) >= 0 : Number(value) > 0);
}

export function validateDetails(master: MasterItem): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of ["title", "description", "category", "condition"] as const) {
    if (!master[field].trim()) errors[field] = "This field is required.";
  }
  return errors;
}

export function validatePricing(master: MasterItem): FieldErrors {
  const errors: FieldErrors = {};
  if (!validMoney(master.price)) errors.price = "Enter a price greater than zero, with at most two decimal places.";
  for (const field of ["retailPrice", "purchaseCost"] as const) {
    if (!validMoney(master[field], true)) errors[field] = "Enter a non-negative amount with at most two decimal places.";
  }
  if (!/^\d+$/.test(master.quantity) || Number(master.quantity) < 1 || !Number.isSafeInteger(Number(master.quantity))) errors.quantity = "Enter a whole quantity of at least 1.";
  if (master.weight && (!Number.isFinite(Number(master.weight)) || Number(master.weight) <= 0)) errors.weight = "Enter a weight greater than zero.";
  return errors;
}

export function effectiveListing(form: ListingFormState, config: MarketplaceConfig) {
  const overrides = form.marketplaces[config.id].overrides;
  return {
    title: overrides.title ?? form.master.title,
    description: overrides.description ?? form.master.description,
    price: overrides.price ?? form.master.price,
  };
}

export function marketplaceIssues(form: ListingFormState, config: MarketplaceConfig, photoCount: number): string[] {
  const effective = effectiveListing(form, config);
  const issues: string[] = [];
  if (!effective.title.trim()) issues.push("Listing title is required");
  if (!effective.description.trim()) issues.push("Description is required");
  if (!validMoney(effective.price)) issues.push("A valid selling price is required");
  if (!form.master.category) issues.push("Master category is required");
  if (!form.master.condition) issues.push("Master condition is required");
  if (photoCount === 0) issues.push("At least one local photo is required");
  for (const requirement of config.requirements) {
    if (!requirement.options.includes(form.marketplaces[config.id].specifics[requirement.key])) issues.push(`${requirement.label} is required`);
  }
  return issues;
}

export function simulatePublish(form: ListingFormState, photoCount: number): PublishResult[] {
  return marketplaces.filter(({ id }) => form.marketplaces[id].selected).map((config) => {
    const issues = marketplaceIssues(form, config, photoCount);
    return { id: config.id, status: issues.length ? "Draft" : "Live", issues };
  });
}
