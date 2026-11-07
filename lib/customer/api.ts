"use client";
import { createApiClient, type Tokens } from "@/lib/api/client";
import { API_URL } from "@/lib/config";
import type { Booking, Checkout, Participant, PayKind, PaymentOrder, Profile } from "./types";

const client = createApiClient({ baseUrl: API_URL, storageKey: "gh_customer_tokens" });
export const { api, tokenStore } = client;

const newKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()) + Math.random());
const results = <T,>(d: T[] | { results: T[] }): T[] => (Array.isArray(d) ? d : d.results);

/** Calls the signed-in customer makes. Public trip data is fetched on the server (see lib/customer/server.ts). */
export const customerApi = {
  /** Sends a sign-in code by WhatsApp. */
  requestOtp: (phone_number: string) =>
    api<{ expires_in_seconds: number; resend_in_seconds: number }>("/auth/request-otp/", { method: "POST", auth: false, json: { phone_number } }),
  verifyOtp: async (phone_number: string, otp: string) => {
    const d = await api<Tokens & { is_new_user: boolean; is_profile_complete: boolean }>("/auth/verify-otp/", { method: "POST", auth: false, json: { phone_number, otp } });
    tokenStore.set({ access: d.access, refresh: d.refresh });
    return d;
  },
  logout: async () => {
    const t = tokenStore.get();
    try { if (t) await api("/auth/logout/", { method: "POST", auth: false, json: { refresh: t.refresh } }); } catch {}
    tokenStore.clear();
  },
  me: () => api<Profile>("/me/"),
  saveProfile: (data: Partial<Pick<Profile, "full_name" | "email" | "preferred_language">>) => api<Profile>("/me/", { method: "PATCH", json: data }),

  /** One trip date, N people. All-or-nothing; the same idempotency key never creates two checkouts. */
  createCheckout: (schedule: string, participant_count: number, pickup_point: string | null, key = newKey()) =>
    api<Checkout>("/checkouts/", { method: "POST", json: { items: [{ schedule, participant_count, pickup_point }] }, headers: { "Idempotency-Key": key } }),
  checkout: (id: string) => api<Checkout>(`/checkouts/${id}/`),
  startPayment: (checkoutId: string, kind: PayKind, bookings?: string[]) =>
    api<PaymentOrder>(`/checkouts/${checkoutId}/pay/`, { method: "POST", json: { kind, ...(bookings ? { bookings } : {}) }, headers: { "Idempotency-Key": newKey() } }),
  confirmPayment: (checkoutId: string, payment: string, razorpay_payment_id: string, razorpay_signature: string) =>
    api<{ status: string }>(`/checkouts/${checkoutId}/confirm/`, { method: "POST", json: { payment, razorpay_payment_id, razorpay_signature } }),

  bookings: async () => results(await api<Booking[] | { results: Booking[] }>("/bookings/")),
  saveParticipants: (bookingId: string, people: Participant[]) =>
    api<Participant[]>(`/bookings/${bookingId}/participants/`, { method: "PUT", json: people }),
  acceptWaiver: (bookingId: string) => api<{ status: string }>(`/bookings/${bookingId}/accept-waiver/`, { method: "POST" }),
  cancelBooking: (bookingId: string, reason: string) => api<Booking>(`/bookings/${bookingId}/cancel/`, { method: "POST", json: { reason } }),
};
