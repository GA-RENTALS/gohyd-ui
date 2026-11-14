import type { Module } from "./api";

/**
 * Sidebar, grouped the way the teams work. Each item needs view access to one table; items a person can't open are hidden.
 * `badge` names a number from /admin/counts/ (work waiting for someone).
 */
export type Features = { team?: boolean };
/** `needs`: view access to one table. `feature`: a page the session says this person may open (see AdminSessionView). */
type Item = { key: string; label: string; icon: string; href: string; needs?: [module: string, resource: string]; feature?: keyof Features; badge?: string; match?: RegExp };
export const SECTIONS: { title: string | null; items: Item[] }[] = [
  { title: null, items: [{ key: "home", label: "Dashboard", icon: "home", href: "/admin", match: /^\/admin\/?$/ }] },
  {
    title: "Sell", items: [
      { key: "trips", label: "Trips", icon: "map", href: "/admin/trips", needs: ["trips", "trips"], match: /^\/admin\/(trips(\/trips)?$|overview\/trip)/ },
      { key: "events", label: "Events", icon: "calendar", href: "/admin/events", needs: ["events", "events"], match: /^\/admin\/(events(\/events)?$|overview\/event)/ },
      { key: "bookings", label: "Bookings", icon: "ticket", href: "/admin/bookings", needs: ["bookings", "bookings"], badge: "event_bookings", match: /^\/admin\/bookings\/?$/ },
      { key: "payments", label: "Payments", icon: "wallet", href: "/admin/payments", needs: ["payments", "payments"], badge: "payments", match: /^\/admin\/payments\/?$/ },
      { key: "marketing", label: "Marketing", icon: "megaphone", href: "/admin/marketing", needs: ["marketing", "coupons"], match: /^\/admin\/marketing\/?$/ },
    ],
  },
  {
    title: "People", items: [
      { key: "customers", label: "Customers", icon: "users", href: "/admin/customers", needs: ["customers", "customers"], match: /^\/admin\/(customers\/?$|customer\/)/ },
      { key: "enquiries", label: "Enquiries", icon: "chat", href: "/admin/crm/enquiries", needs: ["crm", "enquiries"], badge: "enquiries" },
    ],
  },
  {
    title: "Website", items: [
      { key: "destinations", label: "Destinations", icon: "pin", href: "/admin/destinations/destinations", needs: ["destinations", "destinations"] },
      { key: "blogs", label: "Blog posts", icon: "article", href: "/admin/cms/blogs", needs: ["cms", "blogs"] },
    ],
  },
  {
    title: "Settings", items: [
      { key: "settings", label: "Business settings", icon: "settings", href: "/admin/system/settings", needs: ["system", "settings"] },
      { key: "team", label: "Team & roles", icon: "shield", href: "/admin/team", feature: "team", match: /^\/admin\/team\/?$/ },
      { key: "all", label: "All data", icon: "grid", href: "/admin/all", match: /^\/admin\/all/ },
    ],
  },
];

export type NavItem = Item;
export type NavSection = { title: string | null; items: NavItem[] };

const canView = (modules: Module[], module: string, resource: string) =>
  !!modules.find((m) => m.key === module)?.resources.some((r) => r.key === resource && r.actions.view !== false);

export function buildNav(modules: Module[], features: Features = {}): NavSection[] {
  const allowed = (i: Item) => (!i.needs || canView(modules, ...i.needs)) && (!i.feature || !!features[i.feature]);
  return SECTIONS.map((s) => ({ ...s, items: s.items.filter(allowed) })).filter((s) => s.items.length);
}

export const CORE_RESOURCES: Set<string> = new Set(SECTIONS.flatMap((s) => s.items.flatMap((i) => (i.needs ? [i.needs[1]] : []))));

/** Which item is highlighted: its own pattern, otherwise its href, otherwise "All data" for any other table. */
export function activeNav(pathname: string): string {
  const items = SECTIONS.flatMap((s) => s.items);
  const hit = items.find((i) => (i.match ? i.match.test(pathname) : pathname === i.href || pathname.startsWith(`${i.href}/`)));
  if (hit) return hit.key;
  return pathname.split("/").filter(Boolean).length >= 3 ? "all" : "home";
}

export function overviewHref(resourceKey: string, id: string): string | null {
  if (resourceKey === "trips") return `/admin/overview/trip/${id}`;
  if (resourceKey === "events") return `/admin/overview/event/${id}`;
  if (resourceKey === "customers") return `/admin/customer/${id}`;
  return null;
}
