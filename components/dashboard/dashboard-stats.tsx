import type { getDashboardCounts } from "@/lib/inventory/queries";

const valueStyles = {
  neutral: "text-foreground",
  success: "text-emerald-700",
  warning: "text-amber-700",
};

export function DashboardStats({ counts }: { counts: Awaited<ReturnType<typeof getDashboardCounts>> }) {
  const dashboardMetrics: { label: string; value: number; detail: string; tone: keyof typeof valueStyles }[] = [
    { label: "Active items", value: counts.active, detail: "Master items marked active", tone: "neutral" },
    { label: "Draft items", value: counts.draft, detail: "Saved drafts in your inventory", tone: "neutral" },
    { label: "Sold items", value: counts.sold, detail: "Master items marked sold", tone: "success" },
    { label: "Listings needing attention", value: counts.attention, detail: "Errors or missing information", tone: "warning" },
  ];
  return (
    <section aria-label="Inventory overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {dashboardMetrics.map((metric) => (
        <article
          key={metric.label}
          className="rounded-lg border border-border bg-surface px-4 py-4"
        >
          <p className="text-xs font-medium text-muted-foreground">
            {metric.label}
          </p>
          <p
            className={`mt-2 text-2xl font-semibold tracking-[-0.02em] ${valueStyles[metric.tone]}`}
          >
            {metric.value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
        </article>
      ))}
    </section>
  );
}
