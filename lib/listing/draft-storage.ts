import { emptyForm, marketplaces } from "./config";
import { categories } from "./types";
import type { ListingFormState, MasterItem } from "./types";

const storageKey = "crosslisting.create-listing.draft.v1";

// Photos are deliberately excluded: blob URLs are temporary and files cannot
// be restored from localStorage. This stores one text/settings draft only.
export function saveBrowserDraft(form: ListingFormState): void {
  localStorage.setItem(storageKey, JSON.stringify({ version: 1, form }));
}

export function loadBrowserDraft(): ListingFormState | null {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return null;
  const saved: unknown = JSON.parse(raw);
  if (!isRecord(saved) || saved.version !== 1 || !isRecord(saved.form) || !isRecord(saved.form.master) || !isRecord(saved.form.marketplaces)) throw new Error("Invalid draft");
  const form = emptyForm();
  for (const key of Object.keys(form.master) as (keyof MasterItem)[]) {
    const value = saved.form.master[key];
    if (typeof value !== "string") throw new Error("Invalid master field");
    if (key === "category") {
      if (value !== "" && !categories.includes(value as (typeof categories)[number])) throw new Error("Invalid category");
      form.master.category = value as MasterItem["category"];
    } else form.master[key] = value;
  }
  for (const config of marketplaces) {
    const draft = saved.form.marketplaces[config.id];
    if (!isRecord(draft) || typeof draft.selected !== "boolean" || !isRecord(draft.overrides) || !isRecord(draft.specifics)) throw new Error("Invalid marketplace");
    form.marketplaces[config.id].selected = draft.selected;
    for (const field of ["title", "description", "price"] as const) {
      const value = draft.overrides[field];
      if (value !== undefined) {
        if (typeof value !== "string") throw new Error("Invalid override");
        form.marketplaces[config.id].overrides[field] = value;
      }
    }
    for (const requirement of config.requirements) {
      const value = draft.specifics[requirement.key];
      if (value !== undefined && typeof value !== "string") throw new Error("Invalid requirement");
      if (typeof value === "string") form.marketplaces[config.id].specifics[requirement.key] = value;
    }
  }
  return form;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
