"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { customerApi } from "@/lib/customer/api";
import type { Booking, EventBooking } from "@/lib/customer/types";
import { BookingCard } from "./BookingCard";
import { EventBookingsList } from "./EventBookingsList";
import { bucketOf, needsPayment, type Bucket } from "./booking-model";

const TABS: { key: Bucket; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past trips" },
  { key: "cancelled", label: "Cancelled" },
];

function Stat({ value, label, icon }: { value: number; label: string; icon: string }) {
  return (
    <article className="ac-stat">
      <span className="ac-stat-icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg></span>
      <div><div className="ac-stat-number">{value}</div><div className="ac-caption">{label}</div></div>
    </article>
  );
}

export function BookingsView() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Bucket>("upcoming");
  const [eventBookings, setEventBookings] = useState<EventBooking[]>([]);

  const load = useCallback(async () => {
    try { setBookings(await customerApi.bookings()); setError(""); } catch (e: any) { setError(e.message); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  // Separate request: a failure here should not hide trip bookings (and vice versa).
  useEffect(() => { customerApi.myEventBookings().then(setEventBookings).catch(() => setEventBookings([])); }, []);

  const groups = useMemo(() => {
    const g: Record<Bucket, Booking[]> = { upcoming: [], past: [], cancelled: [] };
    for (const b of bookings ?? []) g[bucketOf(b)].push(b);
    g.upcoming.sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));      // soonest first
    g.past.sort((a, b) => +new Date(b.starts_at) - +new Date(a.starts_at));          // most recent first
    return g;
  }, [bookings]);

  // open on the tab that has something in it
  useEffect(() => {
    if (bookings && groups[tab].length === 0) {
      const first = TABS.find((t) => groups[t.key].length > 0);
      if (first) setTab(first.key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]);

  const due = (bookings ?? []).filter((b) => bucketOf(b) === "upcoming" && needsPayment(b)).length;
  const shown = groups[tab];

  return (
    <>
      <section className="ac-hero">
        <div>
          <p className="ac-eyebrow">Your account · GoHyderabad</p>
          <h1>My bookings</h1>
          <p>Track your trips, pay balances and manage everything in one place.</p>
        </div>
        <div className="ac-callout"><strong>Your next weekend is closer than you think</strong><span>Meet · Explore · Experience</span></div>
      </section>

      <section className="ac-stats" aria-label="Summary">
        <Stat value={groups.upcoming.length} label="Upcoming trips" icon="M3 5h18v16H3zM16 3v4M8 3v4M3 10h18" />
        <Stat value={due} label="Payments due" icon="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        <Stat value={groups.past.length} label="Past trips" icon="M5 12l4 4L19 6" />
      </section>

      <section>
        <div className="ac-section-head">
          <h2>Your bookings</h2>
          <div className="ac-tabs" role="tablist" aria-label="Filter bookings">
            {TABS.map((t) => (
              <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={tab === t.key ? "is-active" : undefined} onClick={() => setTab(t.key)}>
                {t.label} ({groups[t.key].length})
              </button>
            ))}
          </div>
        </div>

        {error && <p className="ac-error" role="alert">{error}</p>}
        {bookings === null && !error && <p className="ac-caption" role="status">Loading your bookings…</p>}
        <div className="ac-list">
          {shown.map((b) => <BookingCard key={b.id} booking={b} onChanged={load} />)}
        </div>
        {bookings && shown.length === 0 && (
          <div className="ac-empty">
            <p>{bookings.length === 0 ? "You haven't booked a trip yet." : `Nothing in ${TABS.find((t) => t.key === tab)?.label.toLowerCase()}.`}</p>
            <Link className="ac-btn is-primary" href="/trips">Browse trips</Link>
          </div>
        )}
      </section>

      {eventBookings.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <div className="ac-section-head"><h2>Your event bookings</h2></div>
          <EventBookingsList bookings={eventBookings} onChanged={(b) => setEventBookings((list) => list.map((x) => (x.reference === b.reference ? b : x)))} />
        </section>
      )}
    </>
  );
}
