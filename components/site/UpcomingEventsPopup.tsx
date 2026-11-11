"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/config";
import { eventDateLabel, eventImage, eventPriceLabel, popupEvents, type PublicEvent } from "./upcomingEvents";

const DISMISS_KEY = "gohyd:events-popup-dismissed";
const OPEN_DELAY_MS = 1400;

function wasDismissed(): boolean {
  try { return window.sessionStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
}

function rememberDismissed(): void {
  try { window.sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* storage blocked: the popup may show again */ }
}

async function fetchEvents(signal: AbortSignal): Promise<PublicEvent[] | null> {
  try {
    const response = await fetch(`${API_URL}/events/?lang=en&page_size=50`, { cache: "no-store", signal });
    if (!response.ok) return null;
    const payload: unknown = await response.json();
    if (Array.isArray(payload)) return payload as PublicEvent[];
    if (payload && typeof payload === "object" && Array.isArray((payload as { results?: unknown }).results)) {
      return (payload as { results: PublicEvent[] }).results;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Shown once per browser session when the homepage opens. Lists every upcoming event that staff switched on
 * with "Show in popup" (Admin → Trips → Events), using its popup banner (or cover) as the poster.
 */
export function UpcomingEventsPopup() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (wasDismissed()) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6000);
    let openTimer = 0;
    void fetchEvents(controller.signal).then((list) => {
      window.clearTimeout(timeout);
      const items = popupEvents(list);
      if (!items.length) return;
      setEvents(items);
      openTimer = window.setTimeout(() => {
        const dialog = dialogRef.current;
        if (dialog && !dialog.open && !wasDismissed()) dialog.showModal();
      }, OPEN_DELAY_MS);
    });
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
      window.clearTimeout(openTimer);
    };
  }, []);

  const close = useCallback(() => {
    rememberDismissed();
    dialogRef.current?.close();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => rememberDismissed();
    const onKey = (e: KeyboardEvent) => {
      if (events.length < 2) return;
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % events.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + events.length) % events.length);
    };
    dialog.addEventListener("close", onClose);
    dialog.addEventListener("keydown", onKey);
    return () => {
      dialog.removeEventListener("close", onClose);
      dialog.removeEventListener("keydown", onKey);
    };
  }, [events.length]);

  if (!events.length) return null;
  const event = events[Math.min(index, events.length - 1)];
  const poster = eventImage(event, true);
  const href = `/events/${encodeURIComponent(event.slug)}`;
  const multiple = events.length > 1;

  return (
    <dialog
      ref={dialogRef}
      className="ev-popup"
      aria-labelledby="ev-popup-title"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="ev-popup-card">
        <button className="ev-popup-close" type="button" onClick={close} aria-label="Close upcoming events">×</button>
        <p className="ev-popup-eyebrow">
          {multiple ? `Upcoming events · ${index + 1} of ${events.length}` : "Upcoming event"}
        </p>

        <a className="ev-popup-poster" href={href} onClick={rememberDismissed}>
          {poster
            ? <img src={poster} alt={`${event.title} poster`} />
            : <span className="ev-popup-noposter">{event.title}</span>}
        </a>

        {multiple && (
          <div className="ev-popup-nav">
            <button type="button" className="arrow" onClick={() => setIndex((index - 1 + events.length) % events.length)} aria-label="Previous event">‹</button>
            <div className="ev-popup-dots" role="tablist" aria-label="Choose an event">
              {events.map((item, i) => (
                <button
                  key={item.slug}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={item.title}
                  className={i === index ? "is-active" : undefined}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
            <button type="button" className="arrow" onClick={() => setIndex((index + 1) % events.length)} aria-label="Next event">›</button>
          </div>
        )}

        <div className="ev-popup-body">
          <h2 id="ev-popup-title">{event.title}</h2>
          <p className="ev-popup-meta">
            {eventDateLabel(event)}
            {" · "}
            {eventPriceLabel(event)}
            {typeof event.next_seats_left === "number" && ` · ${event.next_seats_left > 0 ? `${event.next_seats_left} slots left` : "Fully booked"}`}
          </p>
          <div className="ev-popup-actions">
            <a className="btn" href={`${href}#book`} onClick={rememberDismissed}>Book your spot</a>
            <a className="ev-popup-all" href="#events" onClick={close}>See all upcoming events</a>
          </div>
        </div>
      </div>
    </dialog>
  );
}
