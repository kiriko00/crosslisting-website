import { Icon, type IconName } from "@/components/icons";
import { mockRecentActivity } from "@/lib/mock-data";
import type { MockActivityKind } from "@/lib/types";

const activityStyles: Record<
  MockActivityKind,
  { icon: IconName; className: string }
> = {
  error: { icon: "error", className: "bg-red-50 text-red-700" },
  inventory: { icon: "inventory", className: "bg-slate-100 text-slate-600" },
  listing: { icon: "listing", className: "bg-blue-50 text-blue-700" },
  sale: { icon: "sale", className: "bg-emerald-50 text-emerald-700" },
};

export function ActivityFeed() {
  return (
    <section className="rounded-lg border border-border bg-surface">
      <div className="border-b border-border px-4 py-3.5">
        <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Local events from this mock workspace
        </p>
      </div>

      <ol className="divide-y divide-border px-4">
        {mockRecentActivity.map((activity) => {
          const presentation = activityStyles[activity.kind];

          return (
            <li key={activity.id} className="flex gap-3 py-3">
              <span
                className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-md ${presentation.className}`}
              >
                <Icon name={presentation.icon} className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-medium leading-5 text-foreground">
                    {activity.title}
                  </p>
                  <time className="shrink-0 text-[10px] leading-5 text-muted-foreground">
                    {activity.occurredAt}
                  </time>
                </div>
                <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                  {activity.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
