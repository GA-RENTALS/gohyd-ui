import type { Module } from "./api";

/** Sidebar groups: ~7 short items like the Board UI reference; detail navigation lives in the page header. */
export const GROUPS = [
  { key: "home", label: "Home", icon: "home", modules: ["dashboard"] },
  { key: "trips", label: "Trips", icon: "map", modules: ["trips", "destinations"] },
  { key: "bookings", label: "Bookings", icon: "ticket", modules: ["bookings", "checkout", "participants"] },
  { key: "finance", label: "Finance", icon: "landmark", modules: ["payments", "finance"] },
  { key: "customers", label: "Customers", icon: "users", modules: ["customers", "crm", "memberships"] },
  { key: "operations", label: "Operations", icon: "truck", modules: ["vendors", "logistics"] },
  { key: "marketing", label: "Marketing", icon: "megaphone", modules: ["marketing", "analytics", "cms", "notifications"] },
  { key: "settings", label: "Settings", icon: "settings", modules: ["permissions", "audit", "system"], footer: true },
] as const;

export type Group = { key: string; label: string; icon: string; footer?: boolean; modules: Module[] };

export function buildGroups(modules: Module[]): Group[] {
  const byKey = new Map(modules.map((m) => [m.key, m]));
  const used = new Set<string>();
  const out: Group[] = GROUPS.map((g) => {
    const mods = g.modules.map((k) => byKey.get(k)).filter((m): m is Module => !!m && (m.key === "dashboard" || m.resources.length > 0));
    mods.forEach((m) => used.add(m.key));
    return { key: g.key, label: g.label, icon: g.icon, footer: "footer" in g, modules: mods };
  });
  // any module the backend adds later still gets a home under Settings
  const stray = modules.filter((m) => !used.has(m.key) && m.resources.length);
  const settings = out.find((g) => g.key === "settings")!;
  settings.modules.push(...stray);
  return out.filter((g) => g.modules.length);
}

export const groupHref = (g: Group) => (g.key === "home" ? "/admin" : `/admin/${g.modules[0].key}/${g.modules[0].resources[0].key}`);
export const groupOf = (groups: Group[], moduleKey: string) => groups.find((g) => g.modules.some((m) => m.key === moduleKey));
