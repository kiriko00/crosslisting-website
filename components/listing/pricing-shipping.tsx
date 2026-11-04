import { Field, FormSection } from "./form-fields";
import type { MasterFormProps } from "./item-details";

export function PricingShipping({ master, update, errors }: MasterFormProps) {
  return <div className="space-y-8">
    <FormSection title="Pricing & inventory" description="Set the default price; customize by marketplace later. All amounts are USD.">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field id="price" label="Default selling price (USD)" required type="number" min="0.01" step="0.01" value={master.price} onChange={price => update({ price })} error={errors.price} />
        <Field id="retail-price" label="Original retail price (optional)" type="number" min="0" step="0.01" value={master.retailPrice} onChange={retailPrice => update({ retailPrice })} error={errors.retailPrice} />
        <Field id="quantity" label="Quantity" required type="number" min="1" step="1" value={master.quantity} onChange={quantity => update({ quantity })} error={errors.quantity} />
      </div>
      <details open={errors.purchaseCost ? true : undefined} className="border-t border-border pt-4"><summary className="cursor-pointer text-sm font-medium">Internal purchase details (optional)</summary><div className="mt-4 max-w-sm"><Field id="purchase-cost" label="Purchase cost (USD)" type="number" min="0" step="0.01" value={master.purchaseCost} onChange={purchaseCost => update({ purchaseCost })} error={errors.purchaseCost} hint="For future operational analysis; never included in marketplace descriptions." /></div></details>
    </FormSection>
    <div className="border-t border-border pt-6"><FormSection title="Shipping" description="Shared shipping details. Marketplace-specific requirements appear in review.">
      <div className="max-w-sm"><Field id="weight" label="Item weight (lb, optional)" type="number" min="0.01" step="0.01" value={master.weight} onChange={weight => update({ weight })} error={errors.weight} /></div>
      <Field id="shipping-notes" label="Shipping notes / preferences" multiline value={master.shippingNotes} onChange={shippingNotes => update({ shippingNotes })} placeholder="e.g. Domestic shipping preferred" />
    </FormSection></div>
  </div>;
}
