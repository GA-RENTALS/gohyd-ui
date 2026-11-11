/**
 * PostHog product analytics. Loaded only after the visitor allows analytics in the consent banner, and only when
 * NEXT_PUBLIC_POSTHOG_KEY is set. Privacy (requirements 9.3):
 * - no autocapture, so form text (names, phones, OTPs, payment details) is never sent;
 * - session recording off (the consent banner asks about analytics only, not session replay);
 * - the anonymous first-party visitor id is used, so no contact details are attached;
 * - PostHog is never the source of truth for bookings or money.
 */
import type { PostHog } from "posthog-js";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || "";
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";
let client: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;

export const posthogEnabled = () => Boolean(KEY);

export function startPosthog(visitorId: string): Promise<PostHog | null> {
  if (!KEY || typeof window === "undefined") return Promise.resolve(null);
  if (client) { client.opt_in_capturing(); return Promise.resolve(client); }
  loading ??= import("posthog-js").then(({ default: posthog }) => {
    posthog.init(KEY, {
      api_host: HOST,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: true,
      disable_session_recording: true,
      person_profiles: "identified_only",
      respect_dnt: true,
      bootstrap: { distinctID: visitorId },
    });
    client = posthog;
    return posthog;
  }).catch(() => null);
  return loading;
}

export function posthogPageview(path: string) {
  client?.capture("$pageview", { $current_url: window.location.origin + path });
}

/** Visitor declined or withdrew consent: stop sending and forget the local PostHog state. */
export function stopPosthog() {
  if (!client) return;
  client.opt_out_capturing();
  client.reset();
}
