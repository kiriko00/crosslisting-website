import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { SidebarNavigation } from "@/components/sidebar-navigation";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-app">
      <SidebarNavigation />
      <div className="min-w-0 lg:pl-64">
        <TopHeader />
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function TopHeader() {
  return (
    <header className="hidden h-16 items-center justify-between border-b border-border bg-surface px-8 lg:flex">
      <div className="relative w-full max-w-sm">
        <Icon
          name="search"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          aria-label="Search is not available in the mock workspace"
          placeholder="Search inventory (coming soon)"
          readOnly
          className="h-9 w-full rounded-md border border-border bg-surface-subtle pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/15"
        />
      </div>

      <div className="ml-6 flex items-center gap-3">
        <span className="hidden text-xs text-muted-foreground xl:inline">
          Local mock workspace
        </span>
        <button
          type="button"
          disabled
          aria-label="Notifications are not available in the mock workspace"
          className="grid size-9 cursor-not-allowed place-items-center rounded-md border border-border text-muted-foreground opacity-70"
        >
          <Icon name="bell" className="size-[18px]" />
        </button>
        <div className="flex items-center gap-2.5 border-l border-border pl-3">
          <span className="grid size-8 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
            DM
          </span>
          <span className="hidden xl:block">
            <span className="block text-xs font-medium text-foreground">
              Demo workspace
            </span>
            <span className="block text-[11px] text-muted-foreground">
              Mock account
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}
