import type { ReactNode } from "react";

export const secondaryButton = "inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-medium text-foreground hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50";
export const primaryButton = "inline-flex min-h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50";
const inputStyle = "w-full min-w-0 rounded-md border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-2 focus:outline-brand/20";

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  type?: "text" | "number";
  options?: readonly string[];
  multiline?: boolean;
  min?: string;
  step?: string;
}

export function Field({ id, label, value, onChange, hint, error, required, placeholder, type = "text", options, multiline, min, step }: FieldProps) {
  const common = {
    id, value, required,
    "aria-invalid": !!error,
    "aria-describedby": error || hint ? `${id}-help` : undefined,
    className: `${inputStyle} ${error ? "border-red-400" : "border-border"}`,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(event.target.value),
  };
  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">{label}{required ? <span className="ml-1 text-muted-foreground">*</span> : null}</label>
      {options ? (
        <select {...common}><option value="">Select {label.toLowerCase()}</option>{options.map(option => <option key={option} value={option}>{option}</option>)}</select>
      ) : multiline ? <textarea {...common} rows={4} placeholder={placeholder} /> : <input {...common} type={type} min={min} step={step} placeholder={placeholder} />}
      {error || hint ? <p id={`${id}-help`} className={`text-xs leading-5 ${error ? "text-red-700" : "text-muted-foreground"}`}>{error || hint}</p> : null}
    </div>
  );
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="space-y-5"><div><h2 className="text-base font-semibold">{title}</h2>{description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}</div>{children}</section>;
}
