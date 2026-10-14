"use client";

import { useState } from "react";

export const fieldGuidance = {
  title: "Write a clear, searchable title. Include the brand, product type, model or style, and notable characteristics. Marketplace titles can be customized later.",
  description: "Describe the item’s important characteristics and condition. Include details a buyer would want to know beyond the structured fields.",
  condition: "Choose the option that best represents the item’s current condition. Use Condition notes to disclose flaws, wear, repairs, or other important details.",
  sku: "An optional internal identifier for organizing inventory. Buyers do not need to see it. Example: JKT-042.",
};

export function FieldInfo({ id, label, content }: { id: string; label: string; content: string }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 16, top: 16 });
  const popoverId = `${id}-info`;

  return (
    <>
      <button
        type="button"
        aria-label={`About ${label.toLowerCase()}`}
        aria-expanded={open}
        aria-controls={popoverId}
        popoverTarget={popoverId}
        onClick={event => {
          const rect = event.currentTarget.getBoundingClientRect();
          setPosition({
            left: Math.max(16, Math.min(rect.left, window.innerWidth - 336)),
            top: Math.max(16, Math.min(rect.bottom + 8, window.innerHeight - 200)),
          });
        }}
        className="inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-surface-subtle hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4" stroke="currentColor" strokeWidth="1.4">
          <circle cx="10" cy="10" r="7.3" />
          <path d="M10 9v5M10 5.8v.2" strokeLinecap="round" />
        </svg>
      </button>
      <div
        id={popoverId}
        popover="auto"
        role="dialog"
        aria-label={`${label} information`}
        onToggle={event => setOpen(event.newState === "open")}
        style={position}
        className="fixed m-0 max-h-[60vh] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-md border border-border bg-surface p-4 text-sm leading-6 text-foreground shadow-md"
      >
        <p className="mb-1 font-semibold">{label}</p>
        <p className="text-muted-foreground">{content}</p>
      </div>
    </>
  );
}
