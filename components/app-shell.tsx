import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { SidebarNavigation } from "@/components/sidebar-navigation";
import { signOut } from "@/app/auth/actions";

export function AppShell({ children, email }: { children: ReactNode; email: string }) {
  return (
    <div className="min-h-screen bg-app">
      <SidebarNavigation email={email} />
      <div className="min-w-0 lg:pl-64">
        <TopHeader email={email} />
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function TopHeader({ email }: { email: string }) {
  return (
    <header className="hidden h-16 items-center justify-between border-b border-border bg-surface px-8 lg:flex">
      <div className="relative w-full max-w-sm">
        <Icon
          name="search"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          aria-label="Search is not available yet"
          placeholder="Search inventory (coming soon)"
          readOnly
          className="h-9 w-full rounded-md border border-border bg-surface-subtle pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/15"
        />
      </div>

      <div className="ml-6 flex items-center gap-3">
        <span className="hidden text-xs text-muted-foreground xl:inline">
          Private inventory workspace
        </span>
        <button
          type="button"
          disabled
          aria-label="Notifications are not available yet"
          className="grid size-9 cursor-not-allowed place-items-center rounded-md border border-border text-muted-foreground opacity-70"
        >
          <Icon name="bell" className="size-[18px]" />
        </button>
        <div className="flex items-center gap-2.5 border-l border-border pl-3">
          <span className="grid size-8 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
            {email.slice(0, 2).toUpperCase()}
          </span>
          <span className="hidden xl:block">
            <span title={email} className="block max-w-48 truncate text-xs font-medium text-foreground">
              {email}
            </span>
            <span className="block text-[11px] text-muted-foreground">
              Signed in
            </span>
          </span>
        </div>
        <form action={signOut}><button className="text-xs font-medium text-brand underline underline-offset-2">Sign out</button></form>
      </div>
    </header>
  );
}
