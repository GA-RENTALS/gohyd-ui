"use client";
import { ApiError, createApiClient, type Tokens } from "@/lib/api/client";
import { API_URL } from "@/lib/config";

export { ApiError };

const client = createApiClient({ baseUrl: API_URL, storageKey: "gh_admin_tokens" });
export const { api, tokenStore } = client;

export const adminApi = {
  requestOtp: (phone_number: string) => api("/auth/request-otp/", { method: "POST", auth: false, json: { phone_number } }),
  passwordLogin: async (phone_number: string, password: string) => {
    const d = await api<Tokens>("/auth/password-login/", { method: "POST", auth: false, json: { phone_number, password } });
    tokenStore.set({ access: d.access, refresh: d.refresh });
  },
  verifyOtp: async (phone_number: string, otp: string) => {
    const d = await api<Tokens>("/auth/verify-otp/", { method: "POST", auth: false, json: { phone_number, otp } });
    tokenStore.set({ access: d.access, refresh: d.refresh });
  },
  logout: async () => {
    const t = tokenStore.get();
    try { if (t) await api("/auth/logout/", { method: "POST", auth: false, json: { refresh: t.refresh } }); } catch {}
    tokenStore.clear();
  },
  session: () => api("/admin/session/"),
  modules: () => api<{ modules: Module[] }>("/admin/modules/"),
  dashboard: () => api<Dashboard>("/admin/dashboard/"),
  schema: (key: string) => api<Schema>(`/admin/resources/${key}/schema/`),
  list: (key: string, qs: URLSearchParams) => api<Page>(`/admin/resources/${key}/?${qs}`),
  create: (key: string, json: unknown) => api(`/admin/resources/${key}/`, { method: "POST", json }),
  update: (key: string, id: string, json: unknown) => api(`/admin/resources/${key}/${id}/`, { method: "PATCH", json }),
  remove: (key: string, id: string) => api(`/admin/resources/${key}/${id}/`, { method: "DELETE" }),
  action: (name: string, json: unknown) => api(`/admin/actions/${name}/`, { method: "POST", json }),
};

export type Actions = { view?: boolean; create: boolean; update: boolean; delete: boolean };
export type Module = { key: string; label: string; resources: { key: string; label: string; actions: Actions }[] };
export type Dashboard = {
  cards: { key: string; label: string; value: number | string; delta: number | null }[];
  charts: Record<string, any[]>;
  setup: { key: string; severity: "warning" | "info"; title: string; detail: string; href: string }[];
  recent_bookings: { id: string; reference: string; status: string; total_amount: string; created_at: string; primary_booker__full_name: string | null; schedule__trip__slug: string | null }[];
  upcoming_trips: { id: string; starts_at: string; capacity: number; seats_booked: number; trip__slug: string }[];
  as_of: string;
};
export type Field = {
  name: string; label: string; type: string; required: boolean; read_only: boolean; allow_null: boolean; help_text: string;
  choices?: { value: string; label: string }[];
  options?: { value: string; label: string; media_kind?: string; image_preview_url?: string }[];
  many?: boolean;
  /** File fields: the largest upload in MB and the allowed extensions (".png,.pdf"). */
  max_mb?: number; accept?: string;
};
export type Schema = { key: string; label: string; mode: string; pk: string; fields: Field[]; actions: Omit<Actions, "view">; searchable: string[]; ordering: string[] };
export type Page = { count: number; next: string | null; previous: string | null; results: Record<string, any>[] };
