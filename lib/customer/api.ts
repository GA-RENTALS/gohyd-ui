"use client";
import { createApiClient, type Tokens } from "@/lib/api/client";
import { API_URL } from "@/lib/config";
import { clientLang } from "@/lib/lang";
import type { Booking, CartItem, Checkout, CheckoutLineInput, CouponPreview, EventBooking, Invoice, Participant, PayKind, PaymentOrder, Profile } from "./types";

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

  /** Sends an event or plan booking request to the staff CRM inbox; this does not reserve a seat or take payment. */
  submitEventEnquiry: (data: { name: string; phone: string; event?: string; event_schedule?: string; preferred_date?: string; group_size: number; source: string; message: string; consent_to_contact: boolean }) =>
    api<{ status: string }>("/enquiries/", { method: "POST", auth: false, json: data }),

  /** Holds slots on an event date (capacity-checked on the server). Staff confirm it afterwards. */
  createEventBooking: (data: { event: string; schedule: string; name: string; phone: string; email?: string; participant_count: number; note?: string; coupon?: string; consent_to_contact: boolean }) =>
    api<EventBooking>("/event-bookings/", { method: "POST", auth: false, json: data }),
  /** What a coupon takes off an event booking. Nothing is reserved; the booking checks the coupon again. */
  previewEventCoupon: (data: { event: string; participant_count: number; code: string; phone?: string }) =>
    api<CouponPreview>("/event-bookings/coupon-preview/", { method: "POST", auth: false, json: data }),
  newsletterSignup: (email: string) => api<{ status: string }>("/newsletter/", { method: "POST", auth: false, json: { email, consent: true } }),
  /** Reference + the phone used to book. */
  eventBookingStatus: (reference: string, phone: string) =>
    api<EventBooking>(`/event-bookings/${encodeURIComponent(reference.trim().toUpperCase())}/?phone=${encodeURIComponent(phone)}`, { auth: false }),
  /** Uploads the UPI payment screenshot for a booking (reference + the phone used to book). */
  uploadEventPayment: (reference: string, phone: string, screenshot: File, utr = "") => {
    const form = new FormData();
    form.append("phone", phone);
    form.append("screenshot", screenshot);
    if (utr) form.append("utr", utr);
    return api<EventBooking>(`/event-bookings/${encodeURIComponent(reference.trim().toUpperCase())}/payment-proof/`, { method: "POST", auth: false, json: form });
  },

  /** One trip date, N people. All-or-nothing; the same idempotency key never creates two checkouts. */
  createCheckout: (schedule: string, participant_count: number, pickup_point: string | null, coupon = "", key = newKey()) =>
    api<Checkout>("/checkouts/", { method: "POST", json: { items: [{ schedule, participant_count, pickup_point }], ...(coupon ? { coupon } : {}) }, headers: { "Idempotency-Key": key } }),
  /** Several trips at once (from the cart). All-or-nothing on the server. */
  createCheckoutFor: (items: CheckoutLineInput[], coupon = "", key = newKey()) =>
    api<Checkout>("/checkouts/", { method: "POST", json: { items, ...(coupon ? { coupon } : {}) }, headers: { "Idempotency-Key": key } }),
  /** What a coupon takes off these trips. Checkout checks it again. */
  previewCoupon: (code: string, items: CheckoutLineInput[]) =>
    api<CouponPreview>("/coupons/preview/", { method: "POST", json: { code, items } }),

  cart: () => api<CartItem[]>(`/cart/?lang=${clientLang()}`),
  addToCart: (schedule: string, participant_count: number, pickup_point: string | null) =>
    api<CartItem>("/cart/", { method: "POST", json: { schedule, participant_count, pickup_point } }),
  removeFromCart: (itemId: string) => api<void>(`/cart/?item=${encodeURIComponent(itemId)}`, { method: "DELETE" }),

  /** GST invoice for a booking (404 until the booking is paid and the invoice is issued). */
  bookingInvoice: (bookingId: string) => api<Invoice>(`/bookings/${bookingId}/invoice/`),
  checkout: (id: string) => api<Checkout>(`/checkouts/${id}/`),
  startPayment: (checkoutId: string, kind: PayKind, bookings?: string[]) =>
    api<PaymentOrder>(`/checkouts/${checkoutId}/pay/`, { method: "POST", json: { kind, ...(bookings ? { bookings } : {}) }, headers: { "Idempotency-Key": newKey() } }),
  confirmPayment: (checkoutId: string, payment: string, razorpay_payment_id: string, razorpay_signature: string) =>
    api<{ status: string }>(`/checkouts/${checkoutId}/confirm/`, { method: "POST", json: { payment, razorpay_payment_id, razorpay_signature } }),

  bookings: async () => results(await api<Booking[] | { results: Booking[] }>("/bookings/")),
  /** Event bookings made while signed in or with this account's phone number. */
  myEventBookings: () => api<EventBooking[]>("/me/event-bookings/"),
  saveParticipants: (bookingId: string, people: Participant[]) =>
    api<Participant[]>(`/bookings/${bookingId}/participants/`, { method: "PUT", json: people }),
  activeWaiver: () => api<{ id: string; title: string; version: number; language: string; body: string }>("/safety-waivers/active/?lang=en", { auth: false }),
  acceptWaiver: (bookingId: string, waiver: string) => api<{ status: string }>(`/bookings/${bookingId}/accept-waiver/`, { method: "POST", json: { waiver } }),
  cancelBooking: (bookingId: string, reason: string) => api<Booking>(`/bookings/${bookingId}/cancel/`, { method: "POST", json: { reason } }),
};
