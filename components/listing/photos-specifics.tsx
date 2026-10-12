import Image from "next/image";
import { useState } from "react";
import { Field, FormSection, secondaryButton } from "./form-fields";
import type { MasterFormProps } from "./item-details";
import { categoryConfig } from "@/lib/listing/config";
import type { LocalPhoto } from "@/lib/listing/types";

interface PhotosProps extends MasterFormProps {
  photos: LocalPhoto[];
  addPhotos: (files: File[]) => void;
  removePhoto: (id: string) => void;
  makePrimary: (id: string) => void;
}

export function PhotosSpecifics({ master, update, errors, photos, addPhotos, removePhoto, makePrimary }: PhotosProps) {
  const [fileError, setFileError] = useState("");
  return (
    <div className="space-y-8">
      <FormSection title="Photos" description="Choose up to 12 JPEG, PNG, or WebP images, 10 MB each. Files are previewed only in this browser; nothing is uploaded.">
        <label className={`${secondaryButton} cursor-pointer gap-2 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand`}>
          Choose local photos
          <input className="sr-only" type="file" aria-label="Choose local photos" accept="image/jpeg,image/png,image/webp" multiple onChange={event => {
            const files = Array.from(event.target.files ?? []);
            if (files.some(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024)) setFileError("Use JPEG, PNG, or WebP files no larger than 10 MB each.");
            else if (photos.length + files.length > 12) setFileError("You can select up to 12 photos. Remove a photo before adding more.");
            else { addPhotos(files); setFileError(""); }
            event.target.value = "";
          }} />
        </label>
        {fileError || errors.photos ? <p role="alert" className="text-sm text-red-700">{fileError || errors.photos}</p> : null}
        {photos.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo, index) => <div key={photo.id} className="min-w-0 overflow-hidden rounded-md border border-border">
              <div className="relative aspect-square bg-surface-subtle"><Image src={photo.url} alt={`Selected item photo ${index + 1}: ${photo.name}`} fill unoptimized sizes="240px" className="object-contain" /></div>
              <div className="space-y-2 p-3"><p className="truncate text-xs text-muted-foreground" title={photo.name}>{photo.name}</p>
                {index === 0 ? <p className="text-xs font-semibold text-brand">Primary photo</p> : <button type="button" className="text-xs font-medium text-brand underline underline-offset-2" onClick={() => makePrimary(photo.id)}>Make primary</button>}
                <button type="button" aria-label={`Remove ${photo.name}`} className="block text-xs text-red-700 underline underline-offset-2" onClick={() => removePhoto(photo.id)}>Remove</button>
              </div>
            </div>)}
          </div>
        ) : <div className="rounded-md border border-dashed border-border bg-surface-subtle p-5 text-sm text-muted-foreground">No photos selected. Add at least one photo to continue. The first photo is primary.</div>}
      </FormSection>
      <div className="border-t border-border pt-6"><FormSection title="Product specifics" description="Optional details make the master item more useful across marketplaces.">
        <Field id="measurements" label="Measurements" multiline value={master.measurements} onChange={measurements => update({ measurements })} placeholder={master.category ? categoryConfig[master.category].measurementHint : "Add dimensions and units that suit this item."} hint="Free-form measurements with units; use the dimensions relevant to your category." />
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
