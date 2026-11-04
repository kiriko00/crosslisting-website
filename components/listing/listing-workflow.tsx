"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ItemDetails } from "./item-details";
import { PhotosSpecifics } from "./photos-specifics";
import { PricingShipping } from "./pricing-shipping";
import { MarketplaceSelector } from "./marketplace-selector";
import { MarketplaceReview } from "./marketplace-review";
import { FinalReview } from "./final-review";
import { StepNavigation, steps } from "./step-navigation";
import { primaryButton, secondaryButton } from "./form-fields";
import { reorderPhotos } from "@/lib/listing/photo-order";
import { emptyForm, exampleForm, marketplaces } from "@/lib/listing/config";
import { marketplaceIssues, validateDetails, validatePricing } from "@/lib/listing/validation";
import type { FieldErrors, ListingFormState, LocalPhoto, MarketplaceDraft, MarketplaceId, MasterItem } from "@/lib/listing/types";
import type { MarketplaceListing } from "@/lib/supabase/database.types";

export interface EditListingState {
  id: string; revision: number; form: ListingFormState; photos: LocalPhoto[];
  listings: MarketplaceListing[];
}

export function ListingWorkflow({ initial }: { initial?: EditListingState }) {
  const router = useRouter();
  const [form, setForm] = useState<ListingFormState>(()=>initial?.form ?? emptyForm());
  const [photos, setPhotos] = useState<LocalPhoto[]>(()=>initial?.photos ?? []);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const submissionId = useRef<string | null>(null);
  const objectUrls = useRef(new Set<string>());
  const formRegion = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const urls = objectUrls.current;
    return () => { for (const url of urls) URL.revokeObjectURL(url); urls.clear(); };
  }, []);

  function clearFeedback() { setErrors({}); setNotice(""); }
  function updateMaster(changes: Partial<MasterItem>) {
    setForm(previous => ({ ...previous, master: { ...previous.master, ...changes } }));
    clearFeedback();
  }
  function updateDraft(id: MarketplaceId, changes: Partial<MarketplaceDraft>) {
    setForm(previous => ({ ...previous, marketplaces: { ...previous.marketplaces, [id]: { ...previous.marketplaces[id], ...changes } } }));
    clearFeedback();
  }
  function clearPhotos() {
    for (const url of objectUrls.current) URL.revokeObjectURL(url);
    objectUrls.current.clear();
    setPhotos([]);
  }
  function addPhotos(files: File[]) {
    const added = files.map(file => {
      const url = URL.createObjectURL(file);
      objectUrls.current.add(url);
      return { id: crypto.randomUUID(), name: file.name, url, file };
    });
    setPhotos(previous => [...previous, ...added]);
    clearFeedback();
  }
  function removePhoto(id: string) {
    const photo = photos.find(photo => photo.id === id);
    if (photo) { URL.revokeObjectURL(photo.url); objectUrls.current.delete(photo.url); }
    setPhotos(previous => previous.filter(photo => photo.id !== id));
    clearFeedback();
  }
  function movePhoto(sourceId: string, targetId: string) {
    setPhotos(previous => reorderPhotos(previous, sourceId, targetId));
    clearFeedback();
  }
  function errorsForStep(index: number): FieldErrors {
    if (index === 0) return validateDetails(form.master);
    if (index === 1 && !photos.length) return { photos: "Choose at least one local photo to continue." };
    if (index === 2) return validatePricing(form.master);
    if (index === 3 && !marketplaces.some(config => form.marketplaces[config.id].selected)) return { marketplaces: "Select at least one marketplace destination." };
    return {};
  }
  function navigate(target: number) {
    if (target > step) {
      for (let index = 0; index < target; index++) {
        const validation = errorsForStep(index);
        if (Object.keys(validation).length) {
          setStep(index); setErrors(validation); setNotice("Complete the required fields below before continuing.");
          formRegion.current?.focus();
          return;
        }
      }
    }
    setStep(target); setErrors({}); setNotice("");
    formRegion.current?.focus();
  }
  async function save(mode: "draft" | "prepare") {
    if (saving.current) return;
    if (!form.master.title.trim()) { setStep(0); setErrors({ title: "A title is required to save this item." }); setNotice("Add a title before saving."); return; }
    if (mode === "prepare") {
      for (let index = 0; index < 4; index++) {
        const validation = errorsForStep(index);
        if (Object.keys(validation).length) { setStep(index); setErrors(validation); setNotice("Review the required fields before preparing listings."); return; }
      }
    }
    saving.current = true;
    setBusy(true);
    setNotice("Saving your item and uploading photos privately… Keep this page open.");
    try {
      submissionId.current ??= crypto.randomUUID();
      const body = new FormData();
      body.set("submissionId", submissionId.current);
      body.set("mode", mode);
      body.set("listing", JSON.stringify(form));
      const photoOrder: ({existing:string}|{upload:number})[]=[];
      let uploadIndex=0;
      for (const photo of photos) {
        if (photo.storagePath) photoOrder.push({existing:photo.storagePath});
        else if (photo.file) { photoOrder.push({upload:uploadIndex++}); body.append("photos", photo.file); }
        else throw new Error("Reselect your photos before saving.");
      }
      if(initial) { body.set("revision",String(initial.revision)); body.set("mutationId",submissionId.current); body.set("photoOrder",JSON.stringify(photoOrder)); }
      const response = await fetch(initial ? `/api/inventory/${initial.id}` : "/api/inventory", { method: initial ? "PATCH" : "POST", body });
      const result: unknown = await response.json();
      if (!response.ok || !result || typeof result !== "object" || !("id" in result) || typeof result.id !== "string") {
        throw new Error(result && typeof result === "object" && "error" in result && typeof result.error === "string" ? result.error : "The save could not be confirmed. Retry this same form.");
      }
      const warning = "warning" in result && result.warning === "cleanup" ? "&warning=cleanup" : "";
      router.push(`/inventory/${result.id}?saved=1${warning}`);
      router.refresh();
      // Keep disabled until navigation completes, preventing a second save.
      return;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Save failed. Your form is preserved; please retry.");
      saving.current = false;
      setBusy(false);
    }
  }
  const readyCount = marketplaces.filter(config => form.marketplaces[config.id].selected && !marketplaceIssues(form, config, photos.length).length).length;
  const props = { master: form.master, errors, update: updateMaster };

  return <div className="mx-auto max-w-[1200px] space-y-6">
    <PageHeader title={initial ? "Edit listing" : "Create listing"} description={initial ? "Update this master item, photos, and marketplace overrides. Existing external/sold states are preserved." : "Build one master item, then tailor its listings for each marketplace."} />
    <fieldset disabled={busy} className="min-w-0 space-y-6">
    <div className="flex flex-col gap-3 border-y border-border py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs leading-5 text-muted-foreground"><span className="font-semibold text-foreground">Private inventory.</span> Save your item, photos, and marketplace settings to your account. External publishing is not available yet.</p>
      {!initial ? <button type="button" className="shrink-0 text-xs font-medium text-brand underline underline-offset-2" onClick={() => { setForm(exampleForm()); clearPhotos(); setStep(0); setErrors({}); setNotice("Example fields loaded, not saved. Choose your own photos. Saving will create a real inventory item."); }}>Load example fields</button> : null}
    </div>
    {initial?.listings.length ? <details className="text-xs leading-6 text-muted-foreground"><summary className="cursor-pointer font-medium">Stored marketplace state and missing information</summary><ul>{initial.listings.map(listing=><li key={listing.id}>{listing.marketplace}: {listing.status} · {listing.missing_fields.length ? `Missing: ${listing.missing_fields.join(", ")}` : "No stored missing fields"}{listing.delisting_status!=="none" ? ` · Delisting ${listing.delisting_status}` : ""}</li>)}</ul></details> : null}
    <StepNavigation step={step} navigate={navigate} />
    {notice ? <p role="status" className="rounded-md border border-border bg-surface-subtle px-4 py-3 text-sm leading-6">{notice}</p> : null}
    <div ref={formRegion} tabIndex={-1} aria-label={`Step ${step + 1}: ${steps[step]}`} className="rounded-lg border border-border bg-surface p-4 focus:outline-none sm:p-6">
      <p className="mb-4 text-xs font-medium text-muted-foreground">Step {step + 1} of {steps.length} · <span className="text-red-600">*</span> Required</p>
      <form noValidate onSubmit={event => { event.preventDefault(); if (step < 5) navigate(step + 1); }}>
        {step === 0 ? <ItemDetails {...props} /> : null}
        {step === 1 ? <PhotosSpecifics {...props} photos={photos} addPhotos={addPhotos} removePhoto={removePhoto} reorderPhotos={movePhoto} /> : null}
        {step === 2 ? <PricingShipping {...props} /> : null}
        {step === 3 ? <MarketplaceSelector drafts={form.marketplaces} toggle={id => updateDraft(id, { selected: !form.marketplaces[id].selected })} error={errors.marketplaces} /> : null}
        {step === 4 ? <MarketplaceReview form={form} photoCount={photos.length} updateDraft={updateDraft} /> : null}
        {step === 5 ? <FinalReview form={form} photos={photos} editing={Boolean(initial)} /> : null}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <button type="button" disabled={step === 0} className={secondaryButton} onClick={() => navigate(step - 1)}>Back</button>
          <div className="flex flex-wrap gap-3"><button type="button" className={secondaryButton} onClick={() => save("draft")}>{busy ? "Saving…" : initial ? "Save changes" : "Save draft"}</button>{step < 5 ? <button type="submit" className={primaryButton}>Continue</button> : <button type="button" className={primaryButton} disabled={!readyCount} onClick={() => save("prepare")}>Save & prepare listings</button>}</div>
        </div>
        {step === 5 && !readyCount ? <p className="mt-3 text-xs text-amber-800">No marketplaces are ready. Complete at least one listing, or save the incomplete item as a draft.</p> : null}
      </form>
    </div>
    </fieldset>
  </div>;
}
