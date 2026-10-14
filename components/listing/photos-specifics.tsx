import { useState } from "react";
import { SortablePhotos } from "./sortable-photos";
import { Field, FormSection, secondaryButton } from "./form-fields";
import type { MasterFormProps } from "./item-details";
import { categoryConfig } from "@/lib/listing/config";
import type { LocalPhoto } from "@/lib/listing/types";

interface PhotosProps extends MasterFormProps {
  photos: LocalPhoto[];
  addPhotos: (files: File[]) => void;
  removePhoto: (id: string) => void;
  reorderPhotos: (sourceId: string, targetId: string) => void;
}

export function PhotosSpecifics({ master, update, errors, photos, addPhotos, removePhoto, reorderPhotos }: PhotosProps) {
  const [fileError, setFileError] = useState("");
  return (
    <div className="space-y-8">
      <FormSection title="Photos" required description="Up to 12 JPEG, PNG, or WebP images, 10 MB each. Local previews only; nothing is uploaded.">
        <label className={`${secondaryButton} cursor-pointer gap-2 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand`}>
          Choose local photos
          <input className="sr-only" type="file" required={!photos.length} aria-label="Choose local photos" accept="image/jpeg,image/png,image/webp" multiple onChange={event => {
            const files = Array.from(event.target.files ?? []);
            if (files.some(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024)) setFileError("Use JPEG, PNG, or WebP files no larger than 10 MB each.");
            else if (photos.length + files.length > 12) setFileError("You can select up to 12 photos. Remove a photo before adding more.");
            else { addPhotos(files); setFileError(""); }
            event.target.value = "";
          }} />
        </label>
        {fileError || errors.photos ? <p role="alert" className="text-sm text-red-700">{fileError || errors.photos}</p> : null}
        {photos.length ? (
          <SortablePhotos photos={photos} reorder={reorderPhotos} remove={removePhoto} />
        ) : <div className="rounded-md border border-dashed border-border bg-surface-subtle p-5 text-sm text-muted-foreground">Add at least one photo. The first image becomes the Preview photo.</div>}
      </FormSection>
      <div className="border-t border-border pt-6"><FormSection title="Product specifics" description="Optional details make the master item more useful across marketplaces.">
        <Field id="measurements" label="Measurements" multiline value={master.measurements} onChange={measurements => update({ measurements })} placeholder={master.category ? categoryConfig[master.category].measurementHint : "e.g. Length 25 in"} hint="Include units; measure what matters for this item." />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="pattern" label="Pattern" value={master.pattern} onChange={pattern => update({ pattern })} />
          <Field id="style" label="Style" value={master.style} onChange={style => update({ style })} />
          <Field id="era" label="Era / year" value={master.era} onChange={era => update({ era })} placeholder="e.g. 1990s" />
          <Field id="country" label="Country of manufacture" value={master.country} onChange={country => update({ country })} />
        </div>
      </FormSection></div>
    </div>
  );
}
