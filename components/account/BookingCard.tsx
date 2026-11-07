"use client";
import Link from "next/link";
import { useState } from "react";
import { useCustomer } from "@/components/booking/CustomerProvider";
import { customerApi } from "@/lib/customer/api";
import { longDate, money, time } from "@/lib/customer/format";
import { payWithRazorpay } from "@/lib/customer/razorpay";
import type { Booking } from "@/lib/customer/types";
import { bucketOf, needsPayment, statusInfo, timeline } from "./booking-model";

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const PAYMENT_DOWN = "Online payment isn't available right now. Please message GoHyderabad on Instagram to pay.";
const friendly = (m: string) => (/razorpay|gateway|not configured/i.test(m) ? PAYMENT_DOWN : m);

function Icon({ d }: { d: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
}
const ICON = {
  calendar: "M3 5h18v16H3zM16 3v4M8 3v4M3 10h18",
  pin: "M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  ticket: "M3 8a2 2 0 0 0 0 4v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 1 0-4V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2zM14 5v14",
  people: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  chevron: "M9 6l6 6-6 6",
  trip: "M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z",
  help: "M4 13v-2a8 8 0 0 1 16 0v2M2 12h4v7H2zM18 12h4v7h-4z",
};

export function BookingCard({ booking, onChanged }: { booking: Booking; onChanged: () => Promise<void> }) {
  const { user } = useCustomer();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");

  const bucket = bucketOf(booking);
  const status = statusInfo(booking);
  const steps = timeline(booking, shortDate);
  const unpaid = Number(booking.paid) === 0 && bucket !== "cancelled";
  const canCancel = bucket === "upcoming";

  async function payBalance() {
    setBusy(true); setError("");
    try {
      const order = await customerApi.startPayment(booking.checkout, "BALANCE", [booking.id]);
      const paid = await payWithRazorpay(order, { name: user?.full_name, contact: user?.phone_number }, `Balance for ${booking.trip_title}`);
      await customerApi.confirmPayment(booking.checkout, order.payment, paid.razorpay_payment_id, paid.razorpay_signature);
      await onChanged();
    } catch (e: any) { setError(friendly(e.message)); } finally { setBusy(false); }
  }

  async function cancel() {
    setBusy(true); setError("");
    try { await customerApi.cancelBooking(booking.id, reason); setConfirming(false); await onChanged(); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  return (
    <article className="ac-card">
      <div className="ac-photo">
        {booking.trip_cover ? <img src={booking.trip_cover} alt="" loading="lazy" decoding="async" /> : <span aria-hidden="true">{booking.trip_title.slice(0, 1)}</span>}
      </div>

      <div className="ac-main">
        <div className="ac-title-row">
          <h3>{booking.trip_title}</h3>
          <span className={`ac-status is-${status.tone}`}>{status.label}</span>
        </div>
        <ul className="ac-meta">
          <li><Icon d={ICON.calendar} />{longDate(booking.starts_at)} · {time(booking.starts_at)}</li>
          {booking.pickup_point_name && <li><Icon d={ICON.pin} />Pickup: {booking.pickup_point_name}</li>}
          <li><Icon d={ICON.ticket} />Booking ID: {booking.reference}</li>
        </ul>
        <div className="ac-bottom">
          <div><div className="ac-price">{money(booking.total_amount)}</div><div className="ac-caption">Total · {booking.participant_count} {booking.participant_count === 1 ? "person" : "people"}</div></div>
          <div className="ac-actions">
            {unpaid && <Link className="ac-btn is-primary" href={`/checkout/${booking.checkout}`}>Complete payment</Link>}
            {!unpaid && needsPayment(booking) && <button type="button" className="ac-btn is-primary" disabled={busy} onClick={payBalance}>{busy ? "Please wait…" : `Pay balance ${money(booking.outstanding)}`}</button>}
            <button type="button" className="ac-btn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>{open ? "Hide details" : "View details →"}</button>
          </div>
        </div>
        {error && <p className="ac-error" role="alert">{error}</p>}
      </div>

      <aside className="ac-quick" aria-label="Quick links">
        <button type="button" className="ac-qlink" onClick={() => setOpen(true)}><Icon d={ICON.people} />People on this booking<Icon d={ICON.chevron} /></button>
        <Link className="ac-qlink" href={`/trips/${booking.trip}`}><Icon d={ICON.trip} />Trip page<Icon d={ICON.chevron} /></Link>
        <a className="ac-qlink" href="https://www.instagram.com/gohyderabad/" target="_blank" rel="noopener noreferrer"><Icon d={ICON.help} /><span>Need help?<small>Message us on Instagram</small></span><Icon d={ICON.chevron} /></a>
      </aside>

      {bucket === "cancelled" ? (
        <div className="ac-timeline is-cancelled"><p>This booking was cancelled. Any refund due is worked out from the trip's cancellation policy and handled by our team.</p></div>
      ) : (
        <ol className="ac-timeline" aria-label="Booking progress">
          {steps.map((s) => (
            <li key={s.title} className={`ac-step is-${s.state}`}>
              <span className="ac-step-dot" aria-hidden="true">{s.state === "done" ? "✓" : ""}</span>
              <strong>{s.title}</strong><span>{s.date}</span>
            </li>
          ))}
        </ol>
      )}

      {open && (
        <div className="ac-details">
          <div>
            <h4>Payment</h4>
            <dl className="ac-dl">
              <div><dt>Price</dt><dd>{money(booking.subtotal)}</dd></div>
              {Number(booking.tax_amount) > 0 && <div><dt>Tax</dt><dd>{money(booking.tax_amount)}</dd></div>}
              <div><dt>Total</dt><dd>{money(booking.total_amount)}</dd></div>
              <div><dt>Paid so far</dt><dd>{money(booking.paid)}</dd></div>
              <div><dt>Balance</dt><dd>{money(booking.outstanding)}</dd></div>
              {needsPayment(booking) && Number(booking.paid) > 0 && <div><dt>Balance due by</dt><dd className={booking.is_overdue ? "is-late" : undefined}>{longDate(booking.balance_due_at)}</dd></div>}
            </dl>
          </div>
          <div>
            <h4>People</h4>
            {booking.participants.length ? (
              <ul className="ac-people">{booking.participants.map((p, i) => <li key={p.id ?? i}>{p.full_name}{p.age ? `, ${p.age}` : ""}</li>)}</ul>
            ) : <p className="ac-caption">No names added yet. <Link href={`/checkout/${booking.checkout}`}>Add them</Link></p>}
          </div>
          {canCancel && (
            <div className="ac-cancel">
              {!confirming ? <button type="button" className="ac-danger" onClick={() => setConfirming(true)}>Cancel this booking</button> : (
                <>
                  <label htmlFor={`r-${booking.id}`}>Reason (optional)</label>
                  <input id={`r-${booking.id}`} value={reason} onChange={(e) => setReason(e.target.value)} />
                  <p className="ac-caption">Any refund is worked out from the trip's cancellation policy and processed by our team.</p>
                  <div className="ac-actions"><button type="button" className="ac-btn is-danger" disabled={busy} onClick={cancel}>Yes, cancel it</button><button type="button" className="ac-btn" onClick={() => setConfirming(false)}>Keep it</button></div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
