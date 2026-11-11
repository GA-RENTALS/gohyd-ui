"use client";
import { useT } from "@/components/site/LangProvider";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/config";
import { posthogPageview, startPosthog, stopPosthog } from "@/lib/posthog";

const VISITOR_KEY = "gh_visitor_id";
const CONSENT_KEY = "gh_analytics_consent";
const SESSION_KEY = "gh_visitor_session";
const POLICY_VERSION = "1";

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  const hex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16));
  hex[12] = "4";
  hex[16] = ((Number.parseInt(hex[16], 16) & 3) | 8).toString(16);
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = makeId();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = makeId();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function VisitorTracking() {
  const t = useT();
  const pathname = usePathname();
  const [choice, setChoice] = useState<"unknown" | "yes" | "no">("unknown");
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const trackedPath = useRef("");

  useEffect(() => {
    setMounted(true);
    if (navigator.doNotTrack === "1") {
      setChoice("no");
      return;
    }
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored === "yes" || stored === "no") setChoice(stored);
    } catch {
      setChoice("no");
    }
  }, []);

  useEffect(() => {
    if (choice !== "yes" || !pathname || navigator.doNotTrack === "1") return;
    if (trackedPath.current === pathname) return;
    trackedPath.current = pathname;
    let visitorId: string;
    let sessionId: string;
    try {
      visitorId = getVisitorId();
      sessionId = getSessionId();
    } catch {
      return;
    }
    const eventId = makeId();
    let referrer = "";
    try { referrer = document.referrer ? new URL(document.referrer).origin : ""; } catch {}
    const query = new URLSearchParams(window.location.search);
    const session = {
      id: sessionId,
      landing_path: pathname,
      referrer,
      utm_source: query.get("utm_source") || "",
      utm_medium: query.get("utm_medium") || "",
      utm_campaign: query.get("utm_campaign") || "",
    };
    void fetch(`${API_URL}/track/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitor_id: visitorId,
        session,
        events: [{ event_id: eventId, name: "page_view", path: pathname, occurred_at: new Date().toISOString() }],
      }),
      keepalive: true,
    }).catch(() => {});
    void startPosthog(visitorId).then(() => posthogPageview(pathname));
  }, [choice, pathname]);

  // Withdrawing consent (or Do Not Track) also stops PostHog.
  useEffect(() => { if (choice === "no") stopPosthog(); }, [choice]);

  const saveChoice = useCallback(async (analytics: boolean) => {
    setSaving(true);
    setError("");
    try {
      const visitorId = getVisitorId();
      const response = await fetch(`${API_URL}/track/consent/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitor_id: visitorId, analytics, session_replay: false, marketing: false, policy_version: POLICY_VERSION }),
      });
      if (!response.ok) throw new Error("We couldn't save your choice. Please try again.");
      localStorage.setItem(CONSENT_KEY, analytics ? "yes" : "no");
      setChoice(analytics ? "yes" : "no");
    } catch (cause) {
      if (!analytics) {
        try { localStorage.setItem(CONSENT_KEY, "no"); } catch {}
        setChoice("no");
      } else {
        setError(cause instanceof Error ? cause.message : "We couldn't save your choice. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }, []);

  if (!mounted || navigatorSafeDnt()) return null;
  if (choice !== "unknown") {
    return <button className="gh-consent-manage" type="button" onClick={() => setChoice("unknown")}>{t("Privacy choices")}</button>;
  }
  return (
    <aside className="gh-consent" aria-label="Privacy choices">
      <div className="gh-consent-copy">
        <strong>{t("Your privacy choices")}</strong>
        <p>{t("GoHyderabad uses essential storage for the site. With your permission, we also collect anonymous page views to understand which places and experiences are useful. You can decline and still use the site.")}</p>
        {error && <p className="gh-consent-error" role="alert">{error}</p>}
      </div>
      <div className="gh-consent-actions">
        <button type="button" disabled={saving} onClick={() => void saveChoice(false)}>{t("Decline")}</button>
        <button type="button" className="is-primary" disabled={saving} onClick={() => void saveChoice(true)}>{saving ? t("Saving…") : t("Allow analytics")}</button>
      </div>
    </aside>
  );
}

function navigatorSafeDnt(): boolean {
  return typeof navigator !== "undefined" && navigator.doNotTrack === "1";
}
