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
  get: (key: string, id: string) => api<Record<string, any>>(`/admin/resources/${key}/${id}/`),
  create: (key: string, json: unknown) => api(`/admin/resources/${key}/`, { method: "POST", json }),
  update: (key: string, id: string, json: unknown) => api(`/admin/resources/${key}/${id}/`, { method: "PATCH", json }),
  remove: (key: string, id: string) => api(`/admin/resources/${key}/${id}/`, { method: "DELETE" }),
  action: (name: string, json: unknown) => api(`/admin/actions/${name}/`, { method: "POST", json }),
  home: () => api<Home>("/admin/home/"),
  counts: () => api<Partial<Record<"payments" | "event_bookings" | "enquiries", number>>>("/admin/counts/"),
  search: (q: string) => api<{ results: SearchHit[] }>(`/admin/search/?q=${encodeURIComponent(q)}`),
  bookings: (qs: URLSearchParams) => api<ListPage<BookingRow>>(`/admin/lists/bookings/?${qs}`),
  payments: (qs: URLSearchParams) => api<ListPage<any>>(`/admin/lists/payments/?${qs}`),
  customers: (qs: URLSearchParams) => api<ListPage<CustomerRow>>(`/admin/lists/customers/?${qs}`),
  customer: (id: string) => api<CustomerPage>(`/admin/customers/${id}/`),
  catalog: (kind: "trips" | "events", search = "") => api<{ results: CatalogItem[]; can_create: boolean }>(`/admin/catalog/${kind}/${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  overview: (kind: "trip" | "event", id: string, schedule?: string) =>
    api<Overview>(`/admin/overview/${kind}s/${id}/${schedule ? `?schedule=${encodeURIComponent(schedule)}` : ""}`),
};

export type Actions = { view?: boolean; create: boolean; update: boolean; delete: boolean };
export type Module = { key: string; label: string; resources: { key: string; label: string; actions: Actions }[] };
export type Dashboard = {
  cards: { key: string; label: string; value: number | string; delta: number | null }[];
  charts: Record<string, any[]>;
  setup: { key: string; severity: "warning" | "info"; title: string; detail: string; href: string }[];
  recent_bookings: { id: string; reference: string; status: string; total_amount: string; created_at: string; primary_booker__full_name: string | null; schedule__trip__slug: string | null; schedule__trip_id?: string }[];
  upcoming_trips: { id: string; starts_at: string; capacity: number; seats_booked: number; trip__slug: string; trip_id?: string }[];
  recent_event_bookings?: { id: string; reference: string; status: string; total_amount: string; participant_count: number; created_at: string; contact_name: string; schedule__event__slug: string; schedule__event_id?: string; payment_screenshot_url?: string | null }[];
  as_of: string;
};
export type Field = {
  name: string; label: string; type: string; required: boolean; read_only: boolean; allow_null: boolean; help_text: string;
  choices?: { value: string; label: string }[];
  options?: { value: string; label: string; media_kind?: string; image_preview_url?: string }[];
  many?: boolean;
  /** Link to an image in the media library: shown as an upload box, not a dropdown. */
  media?: boolean;
  /** File fields: the largest upload in MB and the allowed extensions (".png,.pdf"). */
  max_mb?: number; accept?: string;
};
export type Schema = { key: string; label: string; mode: string; pk: string; fields: Field[]; actions: Omit<Actions, "view">; searchable: string[]; ordering: string[] };
export type Page = { count: number; next: string | null; previous: string | null; results: Record<string, any>[] };

/** One trip or event with its numbers, bookings, payments to verify and participants (GET /admin/overview/<kind>s/<id>/). */
export type Overview = {
  kind: "trip" | "event"; id: string; slug: string; title: string; status: string;
  operational_status?: string; operational_label?: string; price?: string; venue?: string;
  schedules: { id: string; starts_at: string; ends_at: string | null; capacity: number | null; booked: number; price?: string; is_open: boolean }[];
  schedule: string | null;
  stats: { registrations: number; paid: number; pending: number; pending_with_proof?: number; cancelled: number; participants: number; revenue: string; outstanding: string };
  registrations: {
    id: string; reference: string; status: string; status_label: string; name: string; phone: string; email?: string;
    schedule_id: string; starts_at: string; participants: number; total: string; paid: string; outstanding: string;
    advance_due?: string; checkout_id?: string; payment_proof_url?: string | null; payment_utr?: string;
    reserved_until?: string | null; customer_note?: string; created_at: string;
  }[];
  cover_url?: string | null;
  pending_payments: PaymentRow[];
  payments: PaymentRow[];
  participants: {
    id: string | null; registration_id?: string; name: string; phone: string; booking: string; age?: number | null;
    emergency_contact?: string; waiver?: boolean; group_size?: number | null; booking_status?: string; checked_in_at: string | null;
  }[];
  permissions: Record<string, boolean>;
};

export type PaymentRow = { id: string; amount: string; kind: string; method: string; status?: string; reference: string; payer: string; created_at: string; bookings: string[] };
export type CatalogItem = {
  id: string; slug: string; title: string; status: string; cover_url: string | null; operational_label: string | null; price: string;
  next_date: string | null; next_capacity: number | null; next_booked: number | null; dates: number; upcoming_dates: number;
  bookings: number; pending: number; revenue: string;
};

export type SearchHit = { type: string; label: string; sub: string; href: string };
export type ListPage<T> = { count: number; page: number; pages: number; counts?: Record<string, number>; results: T[]; can?: Record<string, boolean> };
export type BookingRow = {
  id: string; type: "trip" | "event"; reference: string; name: string; phone: string; customer_id: string | null;
  title: string; parent_id: string; starts_at: string; people: number; total: string; paid: string; due: string;
  status: string; status_label: string; bucket: "awaiting" | "paid" | "cancelled";
  checkout_id?: string; advance_due?: string; proof_url?: string | null; utr?: string; note?: string; created_at: string;
};
export type CustomerRow = { id: string; name: string; phone: string; email: string; joined: string; trip_bookings: number; event_bookings: number; spent: string; active: boolean };
export type CustomerPage = {
  id: string; name: string; phone: string; email: string; language: string; joined: string; active: boolean; can_edit: boolean;
  stats: { trip_bookings: number; event_bookings: number; spent: string; due: string };
  trip_bookings: BookingRow[]; event_bookings: BookingRow[];
  payments: { id: string; amount: string; status: string; kind: string; method: string; reference: string; created_at: string }[];
  enquiries: { id: string; message: string; status: string; created_at: string }[];
};
export type Home = {
  name: string | null; as_of: string;
  kpis: { key: string; label: string; value: string | number; format: "money" | "number"; delta: number | null; hint: string }[];
  todo: {
    verify_payments?: { count: number; items: { id: string; amount: string; payer: string; reference: string; kind: string; created_at: string; title: string; parent_id: string | null }[] };
    confirm_events?: { count: number; with_proof: number; items: BookingRow[] };
    balance_due?: { count: number; items: BookingRow[] };
    enquiries?: { count: number; items: { id: string; name: string; phone: string; message: string; created_at: string }[] };
  };
  revenue_30d: { date: string; trips: number; events: number }[];
  upcoming: { kind: "trip" | "event"; parent_id: string; schedule_id: string; title: string; starts_at: string; booked: number; capacity: number | null; is_open: boolean }[];
  top: { kind: "trip" | "event"; parent_id: string; title: string; revenue: string; bookings: number }[];
  activity: { type: string; at: string; name: string; text: string; amount: string; status: string; href: string }[];
  setup: Dashboard["setup"];
  can: Record<string, boolean>;
};
