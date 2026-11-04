import { Field, FormSection } from "./form-fields";
import { fieldGuidance } from "./field-info";
import { MarketplaceIdentity, MarketplaceMark } from "@/components/marketplace-identity";
import { marketplaces } from "@/lib/listing/config";
import { effectiveListing, marketplaceIssues } from "@/lib/listing/validation";
import type { ListingFormState, MarketplaceDraft, MarketplaceId, OverrideField } from "@/lib/listing/types";

export function MarketplaceReview({ form, photoCount, updateDraft }: { form: ListingFormState; photoCount: number; updateDraft: (id: MarketplaceId, changes: Partial<MarketplaceDraft>) => void }) {
  return <FormSection title="Marketplace review" description="Review each destination independently. Missing information on one marketplace does not block another from being ready.">
    <p className="text-xs leading-5 text-muted-foreground">Illustrative demo requirements, not official policies. Customize title, description, and price per marketplace.</p>
    <div className="space-y-4">
      {marketplaces.filter(config => form.marketplaces[config.id].selected).map(config => {
        const draft = form.marketplaces[config.id];
        const effective = effectiveListing(form, config);
        const issues = marketplaceIssues(form, config, photoCount);
        return <details key={config.id} className="rounded-md border border-border bg-surface">
          <summary className="cursor-pointer px-4 py-4 marker:text-muted-foreground"><span className="ml-2 inline-flex w-[calc(100%-2rem)] flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold"><MarketplaceIdentity id={config.id} /><span className="ml-2 text-xs font-normal text-muted-foreground">Demo</span></span><span className={`text-xs font-medium ${issues.length ? "text-amber-700" : "text-emerald-700"}`}>{issues.length ? `Missing information · ${issues.length} ${issues.length === 1 ? "field" : "fields"}` : "Ready"}</span></span></summary>
          <div className="space-y-5 border-t border-border px-4 py-5">
            {issues.length ? <ul className="list-inside list-disc text-xs leading-6 text-amber-800">{issues.map(issue => <li key={issue}>{issue}</li>)}</ul> : <p className="text-xs text-emerald-700">Ready to save internally. External publishing is not available.</p>}
            {(["title", "description", "price"] as OverrideField[]).map(field => {
              const overridden = draft.overrides[field] !== undefined;
              const label = field === "price" ? "Price (USD)" : field === "title" ? "Title" : "Description";
              return <div key={field} className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="text-muted-foreground">{overridden ? "Marketplace override" : "Using master value"}</span>
                  <button type="button" className="font-medium text-brand underline underline-offset-2" onClick={() => {
                    const overrides = { ...draft.overrides };
                    if (overridden) delete overrides[field];
                    else overrides[field] = effective[field];
                    updateDraft(config.id, { overrides });
                  }}>{overridden ? "Restore master value" : `Customize ${field}`}</button>
                </div>
                <Field id={`${config.id}-${field}`} label={`${config.name} ${label.toLowerCase()}`} labelIcon={<MarketplaceMark id={config.id} compact />} required info={field === "title" || field === "description" ? fieldGuidance[field] : undefined} value={effective[field]} multiline={field === "description"} type={field === "price" ? "number" : "text"} min={field === "price" ? "0.01" : undefined} step={field === "price" ? "0.01" : undefined} onChange={value => updateDraft(config.id, { overrides: { ...draft.overrides, [field]: value } })} hint={overridden ? "Customized for this marketplace." : "Edits apply to this marketplace only."} />
              </div>;
            })}
            {config.requirements.length ? <div className="space-y-4 border-t border-border pt-4"><h3 className="text-sm font-semibold">Additional demo requirements</h3>{config.requirements.map(requirement => <Field key={requirement.key} id={`${config.id}-${requirement.key}`} label={requirement.label} required options={requirement.options} value={draft.specifics[requirement.key] ?? ""} onChange={value => updateDraft(config.id, { specifics: { ...draft.specifics, [requirement.key]: value } })} hint="Required here only. Other ready listings can still be prepared." />)}</div> : null}
          </div>
        </details>;
      })}
    </div>
  </FormSection>;
}
