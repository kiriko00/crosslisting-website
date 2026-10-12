import { dashboardMetrics } from "@/lib/mock-data";

const valueStyles = {
  neutral: "text-foreground",
  success: "text-emerald-700",
  warning: "text-amber-700",
};

export function DashboardStats() {
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
