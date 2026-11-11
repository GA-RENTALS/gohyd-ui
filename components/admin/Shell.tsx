"use client";
import {
  RiBankLine, RiCalendarEventLine, RiGroupLine, RiHomeLine, RiMegaphoneLine, RiMenuLine, RiRoadMapLine, RiTicket2Line, RiTruckLine,
} from "@remixicon/react";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { DashboardSidebar, type DashboardNavItem } from "@/components/application/dashboard/dashboard-sidebar";
import { Breadcrumb, BreadcrumbItem } from "@/components/base/breadcrumb/breadcrumb";
import { Button } from "@/components/base/buttons/button";
import { IconButton } from "@/components/base/buttons/icon-button";
import { Skeleton } from "@/components/base/skeleton/skeleton";
import { adminApi, tokenStore, type Module } from "@/lib/admin/api";
import { buildGroups, groupHref, groupOf, type Group } from "@/lib/admin/nav";

type Session = { id: number; name: string; phone_number: string; email: string; permissions: string[] };
type Ctx = { session: Session; modules: Module[]; groups: Group[] };
const AdminCtx = createContext<Ctx | null>(null);
export const useAdmin = () => useContext(AdminCtx)!;

const ICONS: Record<string, ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>> = {
  home: RiHomeLine, map: RiRoadMapLine, calendar: RiCalendarEventLine, ticket: RiTicket2Line, landmark: RiBankLine, users: RiGroupLine, truck: RiTruckLine, megaphone: RiMegaphoneLine,
};

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<{ session: Session; modules: Module[] } | null>(null);
  const [error, setError] = useState("");
  const [drawer, setDrawer] = useState(false);

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

  const ctx = useMemo<Ctx | null>(() => state && { ...state, groups: buildGroups(state.modules) }, [state]);

  if (error) return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <p className="text-title-3-semibold text-text-primary">Couldn't load the admin panel</p>
        <p className="max-w-md text-body-regular text-text-secondary">{error}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>Try again</Button>
      </div>
    </div>
  );
  if (!ctx) return <div className="flex min-h-screen gap-3 p-3"><Skeleton className="hidden h-[calc(100vh-1.5rem)] w-[260px] rounded-3xl lg:block" /><Skeleton className="h-[calc(100vh-1.5rem)] flex-1 rounded-3xl" /></div>;

  const active = groupOf(ctx.groups, pathname.split("/")[2] ?? "dashboard")?.key ?? (pathname === "/admin" ? "home" : "");
  const items: DashboardNavItem[] = ctx.groups.filter((g) => !g.footer).map((g) => ({ key: g.key, label: g.label, icon: ICONS[g.icon] ?? RiHomeLine, href: groupHref(g) }));
  const settings = ctx.groups.find((g) => g.footer);
  const identity = { name: ctx.session.name, subtitle: ctx.session.email || ctx.session.phone_number };
  const signOut = async () => { await adminApi.logout(); router.replace("/admin/login"); };
  const sidebarProps = {
    selected: active, items, user: identity, team: { name: ctx.session.name, subtitle: "GoHyderabad admin" },
    settingsHref: settings ? groupHref(settings) : undefined, onSignOut: signOut,
  };

  return (
    <AdminCtx.Provider value={ctx}>
      <div className="flex h-screen">
        <div className="hidden shrink-0 lg:block"><DashboardSidebar {...sidebarProps} /></div>
        {drawer && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <button aria-label="Close menu" className="absolute inset-0 bg-black/30" onClick={() => setDrawer(false)} />
            <div className="absolute inset-y-0 start-0"><DashboardSidebar {...sidebarProps} mobile onClose={() => setDrawer(false)} /></div>
          </div>
        )}
        <main className="min-w-0 flex-1 overflow-y-auto px-4 pb-10 pt-5 sm:px-8">
          <div className="mb-4 lg:hidden"><IconButton icon={RiMenuLine} aria-label="Open menu" onClick={() => setDrawer(true)} /></div>
          {children}
        </main>
      </div>
    </AdminCtx.Provider>
  );
}

/** Breadcrumb trail, page title and the right-hand action slot. */
export function PageHeader({ crumbs, title, actions }: { crumbs: string[]; title: string; actions?: ReactNode }) {
  const trail = crumbs.filter((c, i) => c && c !== crumbs[i - 1]);
  return (
    <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-2">
        <Breadcrumb>
          <BreadcrumbItem href="/admin">GoHyderabad</BreadcrumbItem>
          {trail.map((c, i) => <BreadcrumbItem key={`${c}-${i}`} current={i === trail.length - 1}>{c}</BreadcrumbItem>)}
        </Breadcrumb>
        <h1 className="text-title-1-semibold tracking-tight text-text-primary">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
