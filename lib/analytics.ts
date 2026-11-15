import { sendGAEvent } from "@next/third-parties/google";

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
export const CONSENT_KEY = "gh_analytics_consent";
export const CONSENT_EVENT = "gh-consent-change";

export function analyticsAllowed(): boolean {
  if (typeof window === "undefined") return false;
  if (navigator.doNotTrack === "1") return false;
  try { return localStorage.getItem(CONSENT_KEY) === "yes"; } catch { return false; }
}

/** Sends a GA4 event only if the visitor allowed analytics. Never pass names, phones or emails. */
export function track(name: string, params: Record<string, unknown> = {}) {
  if (!GA_ID || !analyticsAllowed()) return;
  sendGAEvent("event", name, params);
}