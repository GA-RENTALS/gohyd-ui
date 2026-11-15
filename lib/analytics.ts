/**
 * Google Analytics 4 events for the public site.
 *
 * Rules: never send names, phone numbers, emails, UTR numbers or anything else that identifies a person, and send
 * an event only after the action has succeeded (except `whatsapp_click`, which fires on the tap).
 * GA4 loads for every visitor (owner's decision); the consent banner controls only /track/ and PostHog.
 * GA4 is loaded in app/(public)/layout.tsx only, so admin pages are never tracked.
 */
import { sendGAEvent } from "@next/third-parties/google";

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/** Every event the site sends. Keeping the list here stops typos creating new, empty events in GA4. */
export type AnalyticsEvent =
  | "add_to_cart"
  | "begin_checkout"
  | "purchase"
  | "event_booking_request"
  | "event_payment_proof_uploaded"
  | "generate_lead"
  | "corporate_enquiry"
  | "whatsapp_click";

/** Which WhatsApp button was tapped (the `location` parameter of `whatsapp_click`). */
export type WhatsAppLocation =
  | "event_confirm"
  | "event_interest"
  | "event_waitlist"
  | "event_register_form"
  | "enquiry_sent"
  | "enquiry_form";

export function track(name: AnalyticsEvent, params: Record<string, unknown> = {}) {
  if (!GA_ID || typeof window === "undefined") return;
  sendGAEvent("event", name, params);
}

export function trackWhatsApp(location: WhatsAppLocation, eventSlug: string) {
  track("whatsapp_click", { location, event_slug: eventSlug });
}
