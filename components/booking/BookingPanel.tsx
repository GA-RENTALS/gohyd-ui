"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { customerApi } from "@/lib/customer/api";
import { longDate, money, time } from "@/lib/customer/format";
import type { PickupPoint, Schedule } from "@/lib/customer/types";
import { useCustomer } from "./CustomerProvider";

const MAX_PEOPLE = 10;
const scheduleDateRange = (startsAt: string, endsAt: string) => {
  const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  return date.format(start) === date.format(end) ? longDate(startsAt) : `${date.format(start)} – ${date.format(end)}`;
};

/** Choose a date, how many people and a pickup point, then continue to checkout. */
export function BookingPanel({ slug, schedules, pickups, isOpen }: { slug: string; schedules: Schedule[]; pickups: PickupPoint[]; isOpen: boolean }) {
  const router = useRouter();
  const { user, loading } = useCustomer();
  const bookable = useMemo(() => schedules.filter((s) => s.is_open && s.seats_left > 0), [schedules]);
  const [scheduleId, setScheduleId] = useState(bookable[0]?.id ?? "");
  const [count, setCount] = useState(1);
  const [pickup, setPickup] = useState(pickups[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const schedule = bookable.find((s) => s.id === scheduleId);
  const max = Math.min(MAX_PEOPLE, schedule?.seats_left ?? 1);
  const total = schedule ? Number(schedule.price_per_participant) * count : 0;
  const advance = schedule ? Math.round((total * schedule.advance_basis_points) / 10000) : 0;

  if (!isOpen || bookable.length === 0) {
    return (
      <div className="bk-card bk-sticky" id="book">
        <h2>Book your slot</h2>
        <p className="bk-note">There are no dates open for booking right now. Follow <a href="https://www.instagram.com/gohyderabad/" target="_blank" rel="noopener noreferrer">our Instagram</a> for the next announcement.</p>
      </div>
    );
  }

  async function continueToCheckout() {
    if (!schedule) return;
    setError("");
    if (!user) { router.push(`/login?next=${encodeURIComponent(`/trips/${slug}`)}`); return; }
    setBusy(true);
    try {
      const order = await customerApi.createCheckout(schedule.id, count, pickup || null);
      router.push(`/checkout/${order.id}`);
    } catch (e) {
      const err = e as ApiError;
      const items = (err.body as any)?.details?.items as { reason: string; seats_left?: number }[] | undefined;
      const reason = items?.[0]?.reason;
      setError(reason === "insufficient_seats" ? `Only ${items?.[0]?.seats_left ?? 0} seats are left on this date.` : reason === "unavailable" ? "This date is no longer open for booking." : err.message);
      setBusy(false);
    }
  }

  return (
    <div className="bk-card bk-sticky" id="book">
      <h2>Book your slot</h2>
      <fieldset className="bk-sched">
        <legend className="bk-hint" style={{ marginBottom: 8 }}>Trip dates</legend>
        {bookable.map((s) => (
          <label key={s.id}>
            <span>
              <input type="radio" name="schedule" value={s.id} checked={s.id === scheduleId} onChange={() => { setScheduleId(s.id); setCount((c) => Math.min(c, Math.min(MAX_PEOPLE, s.seats_left))); }} />{" "}
              {s.ends_at ? scheduleDateRange(s.starts_at, s.ends_at)
                : longDate(s.starts_at)}
              <small>{time(s.starts_at)}{s.ends_at ? ` – ${time(s.ends_at)}` : ""} · {s.seats_left} seat{s.seats_left === 1 ? "" : "s"} left</small>
            </span>
            <strong>{money(s.price_per_participant)}</strong>
          </label>
        ))}
      </fieldset>

      <div className="bk-field">
        <span>Travellers</span>
        <div className="bk-stepper" role="group" aria-label="Number of travellers">
          <button type="button" onClick={() => setCount((c) => Math.max(1, c - 1))} disabled={count <= 1} aria-label="One fewer">−</button>
          <output aria-live="polite">{count}</output>
          <button type="button" onClick={() => setCount((c) => Math.min(max, c + 1))} disabled={count >= max} aria-label="One more">+</button>
        </div>
      </div>

      {pickups.length > 0 && (
        <div className="bk-field">
          <label htmlFor="pickup">Pickup point</label>
          <select id="pickup" value={pickup} onChange={(e) => setPickup(e.target.value)}>
            {pickups.map((p) => <option key={p.id} value={p.id}>{p.name}{p.pickup_time ? ` · ${p.pickup_time.slice(0, 5)}` : ""}</option>)}
          </select>
        </div>
      )}

      <div className="bk-total"><span>Total</span><strong>{money(total)}</strong></div>
      <p className="bk-hint" style={{ margin: "-6px 0 16px" }}>
        Pay about {money(advance)} now to hold your spot. Taxes, if any, are shown at checkout.
      </p>

      {error && <p className="bk-error" role="alert">{error}</p>}
      <button type="button" className="btn" disabled={busy || loading} onClick={continueToCheckout} style={{ marginTop: 12 }}>
        {busy ? "Please wait…" : user ? "Continue to checkout" : "Sign in to book"}
      </button>
      {!user && !loading && <p className="bk-hint" style={{ marginTop: 10 }}>We'll send a code to your WhatsApp. <Link href={`/login?next=${encodeURIComponent(`/trips/${slug}`)}`}>Sign in</Link></p>}
    </div>
  );
}
