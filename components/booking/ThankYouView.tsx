"use client";
/**
 * After booking: where Cashfree brings the customer back (?order_id=…), and where free bookings go (?checkout=… for a
 * trip, ?event=GHE-… for an event). A paid order is checked with the server, which asks Cashfree; the browser is never
 * trusted. While Cashfree is still confirming, the page checks again for about a minute.
 */
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { customerApi } from "@/lib/customer/api";
import { OUTCOME_TEXT } from "@/lib/customer/cashfree";
import { longDate, money, time } from "@/lib/customer/format";
import type { Checkout, EventBooking, PaymentOutcome } from "@/lib/customer/types";

type Booked = { kind: "trip"; checkout: Checkout } | { kind: "event"; booking: EventBooking };
type View =
  | { state: "checking" }
  | { state: "done"; booked: Booked; outcome: PaymentOutcome | null }
  | { state: "not-paid"; outcome: PaymentOutcome; booked: Booked | null }
  | { state: "error"; message: string };

const RECHECK_MS = 5000;
const RECHECKS = 12;

/** GA4 purchase, once per Cashfree order: a reload of this page must not count it twice. */
function trackPurchase(orderId: string, booked: Booked, amount: number) {
  const key = `gh_purchase_${orderId}`;
  try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch { /* storage blocked: count it once here */ }
  const items = booked.kind === "trip"
    ? booked.checkout.bookings.map((b) => ({ item_id: b.trip_title, item_name: b.trip_title, item_category: "trip", quantity: b.participant_count }))
    : [{ item_id: booked.booking.event_slug, item_name: booked.booking.event_title, item_category: "event", quantity: booked.booking.participant_count }];
  const reference = booked.kind === "trip" ? booked.checkout.reference : booked.booking.reference;
  track("purchase", { transaction_id: reference, currency: "INR", value: amount, items });
}

async function loadBooked(target: { checkout?: string; event?: string }): Promise<Booked | null> {
  if (target.checkout) return { kind: "trip", checkout: await customerApi.checkout(target.checkout) };
  if (target.event) {
    const booking = (await customerApi.myEventBookings()).find((b) => b.reference === target.event!.toUpperCase());
    return booking ? { kind: "event", booking } : null;
  }
  return null;
}

export function ThankYouView() {
  const [view, setView] = useState<View>({ state: "checking" });
  const rechecks = useRef(0);

  const check = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order_id");
    try {
      if (!orderId) {
        // A free booking: nothing to verify, it is confirmed already.
        const booked = await loadBooked({ checkout: params.get("checkout") ?? undefined, event: params.get("event") ?? undefined });
        setView(booked ? { state: "done", booked, outcome: null } : { state: "error", message: "We couldn't find this booking." });
        return;
      }
      const outcome = await customerApi.verifyPayment(orderId);
      const booked = await loadBooked({ checkout: outcome.checkout, event: outcome.event_booking }).catch(() => null);
      if (outcome.status === "paid" && booked) {
        trackPurchase(orderId, booked, Number(outcome.amount ?? 0));
        setView({ state: "done", booked, outcome });
        return;
      }
      setView({ state: "not-paid", outcome, booked });
      if (outcome.status === "pending" && rechecks.current < RECHECKS) {
        rechecks.current += 1;
        window.setTimeout(() => void check(), RECHECK_MS);
      }
    } catch (e: any) {
      setView({ state: "error", message: e?.status === 404 ? "We couldn't find this payment on your account." : e?.message || "Something went wrong." });
    }
  }, []);

  useEffect(() => { void check(); }, [check]);

  if (view.state === "checking") {
    return (
      <div className="bk-narrow bk-thanks" role="status">
        <div className="eyebrow">Payment</div>
        <h1 className="bk-title">Checking your <em>payment…</em></h1>
        <p className="bk-note">This takes a few seconds. Please don't close this page or pay again.</p>
      </div>
    );
  }

  if (view.state === "error") {
    return (
      <div className="bk-narrow bk-thanks">
        <h1 className="bk-title">Something went <em>wrong.</em></h1>
        <p className="bk-error" role="alert">{view.message}</p>
        <Link className="btn" href="/account">Go to my bookings</Link>
      </div>
    );
  }

  if (view.state === "not-paid") return <NotPaid outcome={view.outcome} booked={view.booked} />;
  return <Confirmed booked={view.booked} outcome={view.outcome} />;
}

/** The booking is confirmed: thank the customer, show what they booked and what happens next. */
function Confirmed({ booked, outcome }: { booked: Booked; outcome: PaymentOutcome | null }) {
  const balancePaid = outcome?.kind === "BALANCE";
  const reference = booked.kind === "trip" ? booked.checkout.reference : booked.booking.reference;
  const stillToPay = booked.kind === "trip"
    ? booked.checkout.bookings.reduce((sum, b) => sum + Number(b.outstanding), 0)
    : Number(booked.booking.outstanding);
  const balanceDue = booked.kind === "trip"
    ? booked.checkout.bookings.filter((b) => Number(b.outstanding) > 0).map((b) => b.balance_due_at).sort()[0]
    : null;

  return (
    <div className="bk-narrow bk-thanks">
      <div className="bk-thanks-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
      </div>
      <div className="eyebrow">{balancePaid ? "Payment received" : "Booking confirmed"}</div>
      <h1 className="bk-title">Thank you! <em>{balancePaid ? "You're all paid." : "You're in."}</em></h1>
      <p className="bk-lede">
        {balancePaid ? "Your balance is paid. " : "Your places are booked. "}
        We've sent the details to your WhatsApp{outcome ? ", and your receipt is in your account" : ""}.
      </p>

      <div className="bk-card" style={{ marginTop: 24 }}>
        <p className="bk-note">Booking reference <strong>{reference}</strong></p>
        {booked.kind === "trip" ? booked.checkout.bookings.map((b) => (
          <div key={b.id} className="bk-booking">
            <h3>{b.trip_title}</h3>
            <dl className="bk-dl">
              <div><dt>Date</dt><dd>{longDate(b.starts_at)}</dd></div>
              <div><dt>People</dt><dd>{b.participant_count}</dd></div>
              {b.pickup_point_name && <div><dt>Pickup</dt><dd>{b.pickup_point_name}</dd></div>}
              <div><dt>Paid</dt><dd>{money(b.paid)}</dd></div>
              <div><dt>Still to pay</dt><dd>{money(b.outstanding)}</dd></div>
            </dl>
          </div>
        )) : (
          <div className="bk-booking">
            <h3>{booked.booking.event_title}</h3>
            <dl className="bk-dl">
              <div><dt>Date</dt><dd>{longDate(booked.booking.starts_at)}{booked.booking.time_tbd ? "" : ` · ${time(booked.booking.starts_at)}`}</dd></div>
              {booked.booking.venue && <div><dt>Venue</dt><dd>{booked.booking.venue}</dd></div>}
              <div><dt>People</dt><dd>{booked.booking.participant_count}</dd></div>
              <div><dt>Paid</dt><dd>{money(booked.booking.paid)}</dd></div>
              <div><dt>Still to pay</dt><dd>{money(booked.booking.outstanding)}</dd></div>
            </dl>
          </div>
        )}
      </div>

      <div className="bk-card">
        <h2>What happens next</h2>
        <ul className="bk-thanks-next">
          <li>You'll get a confirmation on WhatsApp, and a reminder before the {booked.kind === "trip" ? "trip" : "event"}.</li>
          {stillToPay > 0 && (
            <li>The balance of <strong>{money(stillToPay)}</strong> is due {balanceDue ? <>by <strong>{longDate(balanceDue)}</strong></> : "before the start"}. Pay it any time from your account.</li>
          )}
          <li>Plans changed? You can cancel from your account; the refund follows the <Link href="/refund-policy">cancellation policy</Link>.</li>
        </ul>
      </div>

      <div className="bk-thanks-actions">
        <Link className="btn" href="/account">Go to my bookings</Link>
        <Link className="btn btn-ghost" href={booked.kind === "trip" ? "/trips" : "/events"}>Explore more {booked.kind === "trip" ? "trips" : "events"}</Link>
      </div>
    </div>
  );
}

/** Not paid (yet): say what happened and offer the way to pay again. Nothing was taken unless it says pending. */
function NotPaid({ outcome, booked }: { outcome: PaymentOutcome; booked: Booked | null }) {
  const pending = outcome.status === "pending";
  // A trip's first payment is retried from its checkout (participants and waiver are there); everything else from the account.
  const retry = booked?.kind === "trip" && outcome.kind === "ADVANCE" ? `/checkout/${booked.checkout.id}` : "/account";
  const message = outcome.status === "failed" && outcome.message ? `${OUTCOME_TEXT.failed} (${outcome.message})` : OUTCOME_TEXT[outcome.status];
  return (
    <div className="bk-narrow bk-thanks">
      <div className="eyebrow">{pending ? "Payment being confirmed" : "Payment not completed"}</div>
      <h1 className="bk-title">{pending ? <>Almost <em>there.</em></> : <>Not paid <em>yet.</em></>}</h1>
      <p className={pending ? "bk-note" : "bk-error"} role="status">{message}</p>
      {!pending && booked?.kind === "event" && booked.booking.status === "PENDING" && booked.booking.reserved_until && (
        <p className="bk-note">Your places are held until {longDate(booked.booking.reserved_until)} · {time(booked.booking.reserved_until)}.</p>
      )}
      {!pending && booked?.kind === "trip" && booked.checkout.hold_until && (
        <p className="bk-note">Your seats are held until {longDate(booked.checkout.hold_until)} · {time(booked.checkout.hold_until)}.</p>
      )}
      <div className="bk-thanks-actions">
        {!pending && <Link className="btn" href={retry}>Try paying again</Link>}
        <Link className={pending ? "btn" : "btn btn-ghost"} href="/account">Go to my bookings</Link>
      </div>
    </div>
  );
}
