"use client";
import { ApiError, createApiClient, type Tokens } from "@/lib/api/client";
import { API_URL } from "@/lib/config";

export { ApiError };

const client = createApiClient({ baseUrl: API_URL, storageKey: "gh_admin_tokens" });
export const { api, download, tokenStore } = client;

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
  payments: (qs: URLSearchParams) => api<PaymentsPage>(`/admin/lists/payments/?${qs}`),
  /** Same filters as the list, as a CSV file. */
  exportCsv: (path: string, qs: URLSearchParams, name: string) => { qs.set("export", "csv"); return download(`${path}?${qs}`, name); },
  customers: (qs: URLSearchParams) => api<CustomersPage>(`/admin/lists/customers/?${qs}`),
  marketing: <T>(tab: MarketingTab, qs: URLSearchParams) => api<MarketingPage<T>>(`/admin/marketing/${tab}/?${qs}`),
  team: (qs: URLSearchParams) => api<TeamPage>(`/admin/team/?${qs}`),
  inviteStaff: (body: { name: string; phone: string; role: string }) => api<TeamMember>("/admin/team/", { method: "POST", json: body }),
  updateStaff: (id: string, body: { role?: string; active?: boolean }) => api<TeamMember>(`/admin/team/${id}/`, { method: "PATCH", json: body }),
  customer: (id: string) => api<CustomerPage>(`/admin/customers/${id}/`),
  blockCustomer: (id: string, blocked: boolean, reason = "") => api<{ active: boolean }>(`/admin/customers/${id}/block/`, { method: "POST", json: { blocked, reason } }),
  addCustomerNote: (id: string, text: string, channel: NoteChannel) => api<CustomerNote[]>(`/admin/customers/${id}/notes/`, { method: "POST", json: { text, channel } }),
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
  checkout_id?: string; advance_due?: string; proof_url?: string | null; utr?: string; utr_duplicate?: boolean; note?: string; staff_note?: string; created_at: string;
};

export type TripPayment = {
  id: string; amount: string; status: string; kind: string; method: string; reference: string; name: string; phone: string;
  customer_id: string; bookings: string[]; title: string; parent_id: string | null; failure_reason: string; created_at: string;
};
export type RefundRow = {
  id: string; amount: string; status: string; reason: string; booking: string; booking_id: string; name: string; phone: string;
  customer_id: string; title: string; parent_id: string; approved_by: string; created_at: string; updated_at: string;
};
/** Money at a glance on the Payments page. A figure is missing when the staff member can't see its source. */
/** A refund owed on a cancelled, paid event booking. Staff send it by UPI, then record it here. */
export type EventRefundRow = {
  id: string; amount: string; status: "DUE" | "SENT" | "NOT_REFUNDED"; status_label: string; percent: number; paid: string;
  reference: string; booking_id: string; name: string; phone: string; customer_id: string | null; title: string; parent_id: string;
  starts_at: string; cancelled_by: "Customer" | "Staff"; reason: string; upi_reference: string; note: string;
  recorded_by: string; recorded_at: string | null; created_at: string;
};

export type PaymentSummary = {
  received_month?: { amount: string };
  to_verify?: { count: number; amount: string };
  refunds_waiting?: { count: number; amount: string };
  event_refunds_due?: { count: number; amount: string };
  balance_due?: { count: number; amount: string };
  as_of: string;
};
export type PaymentsPage = ListPage<TripPayment | BookingRow | RefundRow | EventRefundRow> & { summary: PaymentSummary };
export type CustomerRow = { id: string; name: string; phone: string; email: string; joined: string; trip_bookings: number; event_bookings: number; spent: string; due: string; active: boolean };
export type CustomersPage = ListPage<CustomerRow> & { summary: { total: number; new_month: number; with_due: number; blocked: number } };
export type NoteChannel = "note" | "call" | "whatsapp" | "email" | "in_person";
export type CustomerNote = { id: string; channel: NoteChannel; text: string; by: string; created_at: string };
export type CustomerPage = {
  id: string; name: string; phone: string; email: string; language: string; joined: string; active: boolean;
  can_edit: boolean; can_block: boolean; can_note: boolean;
  /** null when the staff member may not see notes. */
  notes: CustomerNote[] | null;
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

/* ---------- marketing ---------- */

export type MarketingTab = "coupons" | "campaigns" | "subscribers" | "referrals";
export type CouponRow = {
  id: string; code: string; discount_label: string; percent: number | null; fixed_amount: string | null;
  state: "active" | "scheduled" | "ended" | "paused"; is_active: boolean; uses: number; max_redemptions: number | null; per_user_limit: number;
  discount_total: string; valid_from: string | null; valid_until: string | null; trips: string[]; trips_text: string;
};
export type CampaignRow = {
  id: string; name: string; utm_campaign: string; is_active: boolean; starts_on: string | null; ends_on: string | null;
  spend: string; visitors: number; bookings: number; revenue: string; cost_per_booking: string | null;
};
export type SubscriberRow = { id: string; email: string; consent_at: string; unsubscribed_at: string | null; subscribed: boolean };
export type ReferralRow = {
  id: string; name: string; is_active: boolean; referrer_reward: string; referee_discount: string; referrals: number; rewarded: number; rewards_owed: string;
};
export type MarketingSummary = {
  coupons?: { live: number; uses_month: number; discount_month: string };
  campaigns?: { running: number; spend_month: string };
  subscribers?: { total: number; new_month: number };
  referrals?: { month: number; unrewarded: number };
};
export type MarketingPage<T> = Omit<ListPage<T>, "can"> & {
  summary: MarketingSummary;
  can: { create: boolean; update: boolean; add_cost?: boolean; tabs: MarketingTab[] };
};

/* ---------- team ---------- */

export type AccessLevel = "" | "view" | "edit" | "full";
export type TeamMember = {
  id: string; name: string; phone: string; email: string; role: string; is_admin: boolean; active: boolean;
  last_sign_in: string | null; added_at: string; is_you: boolean; is_superuser: boolean;
};
export type RoleInfo = { name: string; description: string; access: Record<string, AccessLevel>; exists: boolean };
export type TeamPage = {
  results: TeamMember[];
  roles: RoleInfo[];
  areas: { key: string; label: string }[];
  can: { manage: boolean; roles: string[] };
};
