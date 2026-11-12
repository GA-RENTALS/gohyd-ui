"use client";
import {
  RiApps2Line, RiArticleLine, RiCalendarEventLine, RiChat3Line, RiCloseLine, RiGroupLine, RiHomeLine, RiLogoutBoxRLine,
  RiMapPinLine, RiMenuLine, RiRoadMapLine, RiSearchLine, RiSettings4Line, RiTicket2Line, RiWallet3Line,
} from "@remixicon/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { CommandPalette } from "@/components/admin/CommandPalette";
import { Initials } from "@/components/admin/ui";
import { ThemeToggle } from "@/components/application/theme/theme-toggle";
import { Breadcrumb, BreadcrumbItem } from "@/components/base/breadcrumb/breadcrumb";
import { Button } from "@/components/base/buttons/button";
import { Skeleton } from "@/components/base/skeleton/skeleton";
import { adminApi, tokenStore, type Module } from "@/lib/admin/api";
import { activeNav, buildNav, type NavSection } from "@/lib/admin/nav";
import { cx } from "@/utils/cx";

type Session = { id: number; name: string; phone_number: string; email: string; permissions: string[] };
type Ctx = { session: Session; modules: Module[]; nav: NavSection[]; refreshCounts: () => void; openSearch: () => void };
const AdminCtx = createContext<Ctx | null>(null);
export const useAdmin = () => useContext(AdminCtx)!;

const ICONS: Record<string, ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>> = {
  home: RiHomeLine, map: RiRoadMapLine, calendar: RiCalendarEventLine, ticket: RiTicket2Line, wallet: RiWallet3Line, users: RiGroupLine,
  chat: RiChat3Line, pin: RiMapPinLine, article: RiArticleLine, settings: RiSettings4Line, grid: RiApps2Line,
};

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<{ session: Session; modules: Module[] } | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);

  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    if (!tokenStore.get()) { router.replace("/admin/login"); return; }
    Promise.all([adminApi.session(), adminApi.modules()])
      .then(([session, m]) => setState({ session, modules: m.modules }))
      .catch((e) => {
        if (e.status === 401 || e.status === 403) { tokenStore.clear(); router.replace("/admin/login"); }
        else setError(e.message || "Couldn't reach the server.");
      });
  }, [router]);

  const refreshCounts = useCallback(() => { adminApi.counts().then((c) => setCounts(c as Record<string, number>)).catch(() => {}); }, []);
  // badges: on load, on every page change, and every minute
  useEffect(() => { if (state) refreshCounts(); }, [state, pathname, refreshCounts]);
  useEffect(() => { const t = setInterval(refreshCounts, 60000); return () => clearInterval(t); }, [refreshCounts]);

  // ⌘K / Ctrl+K opens search from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearch(true); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ctx = useMemo<Ctx | null>(() => state && { ...state, nav: buildNav(state.modules), refreshCounts, openSearch: () => setSearch(true) }, [state, refreshCounts]);

  if (error) return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <p className="text-title-3-semibold text-text-primary">Couldn't load the admin panel</p>
        <p className="max-w-md text-body-regular text-text-secondary">{error}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>Try again</Button>
      </div>
    </div>
  );
  if (!ctx) return <div className="flex min-h-screen gap-3 p-3"><Skeleton className="hidden h-[calc(100vh-1.5rem)] w-[248px] rounded-2xl lg:block" /><Skeleton className="h-[calc(100vh-1.5rem)] flex-1 rounded-2xl" /></div>;

  const signOut = async () => { await adminApi.logout(); router.replace("/admin/login"); };
  const sidebar = <Sidebar nav={ctx.nav} active={activeNav(pathname)} counts={counts} session={ctx.session} onSearch={() => setSearch(true)} onSignOut={signOut} />;

  return (
    <AdminCtx.Provider value={ctx}>
      <div className="flex h-screen bg-background-full">
        <div className="hidden w-[248px] shrink-0 lg:block">{sidebar}</div>
        {drawer && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <button aria-label="Close menu" className="absolute inset-0 bg-black/30" onClick={() => setDrawer(false)} />
            <div className="absolute inset-y-0 start-0 w-[272px]">
              <button aria-label="Close menu" onClick={() => setDrawer(false)} className="absolute end-3 top-4 z-10 grid size-8 place-items-center rounded-lg hover:bg-background-secondary-default"><RiCloseLine className="size-5" /></button>
              {sidebar}
            </div>
          </div>
        )}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-separator-border bg-background-full/90 px-4 py-2.5 backdrop-blur lg:hidden">
            <button aria-label="Open menu" onClick={() => setDrawer(true)} className="grid size-9 place-items-center rounded-lg border border-border-button-default"><RiMenuLine className="size-5" /></button>
            <span className="flex-1 text-body-medium font-semibold text-text-primary">GoHyderabad</span>
            <button aria-label="Search" onClick={() => setSearch(true)} className="grid size-9 place-items-center rounded-lg border border-border-button-default"><RiSearchLine className="size-5" /></button>
          </div>
          <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-6 sm:px-8">{children}</div>
        </main>
      </div>
      <CommandPalette open={search} onClose={() => setSearch(false)} nav={ctx.nav} />
    </AdminCtx.Provider>
  );
}

function Sidebar({ nav, active, counts, session, onSearch, onSignOut }: {
  nav: NavSection[]; active: string; counts: Record<string, number>; session: Session; onSearch: () => void; onSignOut: () => void;
}) {
  return (
    <nav className="flex h-full flex-col gap-1 border-e border-separator-border bg-background-primary-default px-3 py-4" aria-label="Main">
      <Link href="/admin" className="mb-3 flex items-center gap-2.5 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/admin-favicon-32.png" alt="" className="size-8 rounded-lg" />
        <span className="leading-tight"><span className="block text-body-medium font-semibold text-text-primary">GoHyderabad</span><span className="block text-caption-1-medium text-text-tertiary">Admin</span></span>
      </Link>

      <button onClick={onSearch} className="mb-3 flex h-9 items-center gap-2 rounded-lg border border-border-button-default bg-background-secondary-default px-2.5 text-body-regular text-text-tertiary hover:text-text-secondary">
        <RiSearchLine className="size-4" aria-hidden /> <span className="flex-1 text-start">Search…</span>
        <kbd className="rounded border border-border-button-default bg-background-primary-default px-1.5 text-caption-1-medium">⌘K</kbd>
      </button>

      <div className="flex-1 overflow-y-auto">
        {nav.map((section, i) => (
          <div key={section.title ?? i} className="mb-3">
            {section.title && <p className="px-2.5 pb-1 pt-2 text-caption-1-medium font-medium uppercase tracking-wider text-text-tertiary">{section.title}</p>}
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const Icon = ICONS[item.icon] ?? RiHomeLine;
                const on = active === item.key;
                const badge = item.badge ? counts[item.badge] : 0;
                return (
                  <li key={item.key}>
                    <Link href={item.href} aria-current={on ? "page" : undefined}
                      className={cx("flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-body-medium transition-colors",
                        on ? "bg-background-secondary-default font-medium text-text-primary" : "text-text-secondary hover:bg-background-secondary-default/60 hover:text-text-primary")}>
                      <Icon className={cx("size-[18px] shrink-0", on ? "text-text-primary" : "text-foreground-icon-tertiary")} aria-hidden />
                      <span className="flex-1 truncate">{item.label}</span>
                      {badge > 0 && <span className="min-w-5 rounded-full bg-accent-500 px-1.5 text-center text-caption-1-medium font-semibold text-white" title="Waiting for action">{badge > 99 ? "99+" : badge}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-2 border-t border-separator-border px-1 pt-3">
        <Initials name={session.name} size="sm" />
        <span className="min-w-0 flex-1"><span className="block truncate text-body-medium text-text-primary">{session.name}</span><span className="block truncate text-caption-1-medium text-text-tertiary">{session.email || session.phone_number}</span></span>
        <ThemeToggle appearance="sidebar" collapsed />
        <button onClick={onSignOut} aria-label="Sign out" title="Sign out" className="grid size-8 place-items-center rounded-lg text-foreground-icon-tertiary hover:bg-background-secondary-default hover:text-text-primary"><RiLogoutBoxRLine className="size-[18px]" /></button>
      </div>
    </nav>
  );
}

/** Breadcrumb trail, page title and the right-hand action slot. A crumb may be a link ({ label, href }). */
export type Crumb = string | { label: string; href: string };
export function PageHeader({ crumbs, title, actions }: { crumbs: Crumb[]; title: string; actions?: ReactNode }) {
  const label = (c: Crumb) => (typeof c === "string" ? c : c.label);
  const trail = crumbs.filter((c, i) => label(c) && label(c) !== (i > 0 ? label(crumbs[i - 1]) : ""));
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-2">
        {trail.length > 1 && (
          <Breadcrumb>
            {trail.slice(0, -1).map((c, i) => (
              <BreadcrumbItem key={`${label(c)}-${i}`} href={typeof c === "string" ? undefined : c.href}>{label(c)}</BreadcrumbItem>
            ))}
            <BreadcrumbItem current>{label(trail[trail.length - 1])}</BreadcrumbItem>
          </Breadcrumb>
        )}
        <h1 className="text-title-1-semibold tracking-tight text-text-primary">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
