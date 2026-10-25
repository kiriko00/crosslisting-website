"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { signOut } from "@/app/auth/actions";

interface PrimaryLink {
  label: string;
  href: string;
  icon: IconName;
}

interface NavigationGroup {
  label: string;
  href: string;
  icon: IconName;
  children: { label: string; href: string }[];
}

const navigation: (PrimaryLink | NavigationGroup)[] = [
  { label: "Dashboard", href: "/", icon: "dashboard" },
  {
    label: "Inventory",
    href: "/inventory",
    icon: "inventory",
    children: [
      { label: "All items", href: "/inventory" },
      { label: "Drafts", href: "/inventory/drafts" },
      { label: "Sold", href: "/inventory/sold" },
    ],
  },
  {
    label: "Listings",
    href: "/listings",
    icon: "listing",
    children: [
      { label: "Live", href: "/listings/live" },
      { label: "Missing", href: "/listings/missing" },
      { label: "Errors", href: "/listings/errors" },
    ],
  },
  { label: "Create listing", href: "/create-listing", icon: "plus" },
  { label: "Marketplaces", href: "/marketplaces", icon: "marketplace" },
  { label: "Sales", href: "/sales", icon: "sale" },
  { label: "Settings", href: "/settings", icon: "settings" },
];

function Brand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
    >
      <span className="grid size-8 place-items-center rounded-md bg-brand text-sm font-semibold text-white">
        C
      </span>
      <span>
        <span className="block text-[15px] font-semibold tracking-tight text-foreground">
          Crosslisting
        </span>
        <span className="block text-[11px] font-medium text-muted-foreground">
          Inventory workspace
        </span>
      </span>
    </Link>
  );
}

function NavContent({ onNavigate, email }: { onNavigate?: () => void; email: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation" className="flex flex-1 flex-col">
      <div className="space-y-1">
        {navigation.map((item) => {
          if ("children" in item) {
            const groupActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <div key={item.label} className="pt-1">
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand ${
                    groupActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
                  }`}
                >
                  <Icon name={item.icon} className="size-[18px]" />
                  <span>{item.label}</span>
                </Link>
                <div className="ml-[21px] mt-1 space-y-0.5 border-l border-border pl-[18px]">
                  {item.children.map((child) => {
                    const childActive = pathname === child.href;

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onNavigate}
                        aria-current={childActive ? "page" : undefined}
                        className={`flex h-8 items-center rounded-md px-2 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand ${
                          childActive
                            ? "bg-brand-subtle font-medium text-brand"
                            : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
                        }`}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand ${
                active
                  ? "bg-brand-subtle text-brand"
                  : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
              }`}
            >
              <Icon name={item.icon} className="size-[18px]" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto border-t border-border pt-4">
        <div className="rounded-md bg-surface-subtle px-3 py-2.5">
          <p className="text-xs font-medium text-foreground">Private inventory</p>
          <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
            No external marketplaces are connected.
          </p>
        </div>
        <p className="mt-3 truncate px-3 text-xs text-muted-foreground" title={email}>{email}</p>
        <form action={signOut} className="px-3 pt-2"><button className="min-h-9 text-xs font-medium text-brand underline underline-offset-2">Sign out</button></form>
      </div>
    </nav>
  );
}

export function SidebarNavigation({ email }: { email: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-y-auto border-r border-border bg-surface px-4 pb-4 pt-5 lg:flex">
        <div className="mb-7 px-2">
          <Brand />
        </div>
        <NavContent email={email} />
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
        <Brand />
        <button
          type="button"
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
          className="grid size-10 place-items-center rounded-md border border-border text-foreground outline-none hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Icon name="menu" className="size-5" />
        </button>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-950/30"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(19rem,88vw)] flex-col overflow-y-auto bg-surface px-4 pb-4 pt-5 shadow-xl">
            <div className="mb-7 flex items-center justify-between px-2">
              <Brand />
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
                className="grid size-9 place-items-center rounded-md text-muted-foreground outline-none hover:bg-surface-subtle hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand"
              >
                <Icon name="x" className="size-5" />
              </button>
            </div>
            <NavContent email={email} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
