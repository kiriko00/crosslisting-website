export const steps = ["Item details", "Photos & specifics", "Pricing & shipping", "Select marketplaces", "Marketplace review", "Review & finish"] as const;

export function StepNavigation({ step, navigate }: { step: number; navigate: (step: number) => void }) {
  return <nav aria-label="Listing creation steps"><ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">{steps.map((label, index) => <li key={label}><button type="button" onClick={() => navigate(index)} aria-current={step === index ? "step" : undefined} className={`flex h-full w-full items-start gap-2 rounded-md border px-3 py-3 text-left text-xs leading-5 focus-visible:outline-2 focus-visible:outline-brand ${step === index ? "border-brand bg-brand-subtle text-brand" : "border-border bg-surface text-muted-foreground hover:text-foreground"}`}><span className="font-semibold">{index + 1}.</span><span className={step === index ? "font-semibold" : "font-medium"}>{label}</span></button></li>)}</ol></nav>;
}
