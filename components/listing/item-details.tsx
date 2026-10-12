import { Field, FormSection } from "./form-fields";
import { categoryConfig } from "@/lib/listing/config";
import { categories } from "@/lib/listing/types";
import type { FieldErrors, MasterItem } from "@/lib/listing/types";

export interface MasterFormProps {
  master: MasterItem;
  errors: FieldErrors;
  update: (changes: Partial<MasterItem>) => void;
}

export function ItemDetails({ master, errors, update }: MasterFormProps) {
  const category = master.category ? categoryConfig[master.category] : undefined;
  return (
    <FormSection title="Item details" description="Describe the physical item once. This master information will be inherited by each marketplace.">
      <Field id="title" label="Listing title" required value={master.title} onChange={title => update({ title })} error={errors.title} placeholder="e.g. Levi’s 70505 vintage denim jacket" />
      <Field id="description" label="Description" required multiline value={master.description} onChange={description => update({ description })} error={errors.description} hint="Include fit, features, wear, and anything a buyer should know." />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field id="category" label="Category" required options={categories} value={master.category} onChange={category => update({ category: category as MasterItem["category"], subcategory: "" })} error={errors.category} />
        {category ? <Field id="subcategory" label="Subcategory" options={category.subcategories} value={master.subcategory} onChange={subcategory => update({ subcategory })} /> : null}
        <Field id="brand" label="Brand" value={master.brand} onChange={brand => update({ brand })} placeholder="e.g. Levi’s" />
        <Field id="department" label="Department / intended wearer" options={["Women", "Men", "Unisex", "Kids", "Not applicable"]} value={master.department} onChange={department => update({ department })} />
        <Field id="size" label={category?.sizeLabel ?? "Size"} value={master.size} onChange={size => update({ size })} />
        <Field id="color" label="Color" value={master.color} onChange={color => update({ color })} />
        <Field id="material" label="Material" value={master.material} onChange={material => update({ material })} />
        <Field id="condition" label="Condition" required options={["New with tags", "New without tags", "Excellent", "Good", "Fair"]} value={master.condition} onChange={condition => update({ condition })} error={errors.condition} />
        <Field id="sku" label="SKU (optional)" value={master.sku} onChange={sku => update({ sku })} placeholder="Your internal reference" />
      </div>
      <Field id="condition-notes" label="Condition notes" multiline value={master.conditionNotes} onChange={conditionNotes => update({ conditionNotes })} placeholder="Describe fading, scratches, repairs, or other wear." />
    </FormSection>
  );
}
