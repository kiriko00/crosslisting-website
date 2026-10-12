import type { InventoryStatus, ListingStatus } from "@/lib/types";

type Status = InventoryStatus | ListingStatus;

const styles: Record<Status, string> = {
  Active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Draft: "border-slate-200 bg-slate-50 text-slate-600",
  Ready: "border-sky-200 bg-sky-50 text-sky-700",
  Publishing: "border-blue-200 bg-blue-50 text-blue-700",
  Live: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Error: "border-red-200 bg-red-50 text-red-700",
  Sold: "border-violet-200 bg-violet-50 text-violet-700",
  Delisted: "border-slate-200 bg-slate-50 text-slate-600",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}
