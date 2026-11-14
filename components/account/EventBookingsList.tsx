"use client";
import Link from "next/link";
import { useState } from "react";
import { customerApi } from "@/lib/customer/api";
import { longDate, money, time } from "@/lib/customer/format";
import type { EventBooking } from "@/lib/customer/types";

const STATUS_CLASS: Record<EventBooking["status"], string> = {
  PENDING: "is-wait", CONFIRMED: "is-good", CANCELLED: "is-bad", EXPIRED: "is-bad",
};

/** Event bookings (paid by UPI, confirmed by our team): reference, date, people, total, cancelling and any refund. */
export function EventBookingsList({ bookings, onChanged }: { bookings: EventBooking[]; onChanged: (booking: EventBooking) => void }) {
  return (
    <div className="ac-list">
      {bookings.map((b) => <EventBookingCard key={b.reference} booking={b} onChanged={onChanged} />)}
    </div>
  );
}

function EventBookingCard({ booking: b, onChanged }: { booking: EventBooking; onChanged: (booking: EventBooking) => void }) {
  return (
    <article className="ac-card is-event">
      <div className="ac-main">
        <div className="ac-title-row">
          <h3><Link href={`/events/${b.event_slug}`}>{b.event_title}</Link></h3>
          <span className={`ac-status ${STATUS_CLASS[b.status]}`}>{b.status_label}</span>
        </div>
        <ul className="ac-meta">
          <li>Reference: <strong>{b.reference}</strong></li>
          <li>{longDate(b.starts_at)}{b.time_tbd ? " · Time to be confirmed" : ` · ${time(b.starts_at)}`}</li>
          {b.venue && <li>{b.venue}</li>}
          <li>{b.participant_count} {b.participant_count === 1 ? "participant" : "participants"}</li>
          {b.status === "PENDING" && b.reserved_until && <li>Slots held until {longDate(b.reserved_until)} · {time(b.reserved_until)}</li>}
          {b.payment && b.status !== "CANCELLED" && <li>Payment screenshot: <strong>{b.payment_submitted ? "sent" : "not sent yet"}</strong></li>}
        </ul>
        <div className="ac-bottom">
          <span className="ac-price">{money(b.total_amount)}</span>
          <span className="ac-caption">{caption(b)}</span>
        </div>
        {b.status === "CANCELLED" && <RefundNote booking={b} />}
        {b.cancellation && <CancelBox booking={b} onChanged={onChanged} />}
      </div>
    </article>
  );
}

function caption(b: EventBooking) {
  if (b.status === "CONFIRMED") return "See you there!";
  if (b.status !== "PENDING") return "";
  if (!b.payment) return "Our team will confirm your place. Pay at the venue.";
  if (b.payment_submitted) return "We're checking your payment and will confirm on WhatsApp.";
  return <>To pay, open the <Link href={`/events/${b.event_slug}#book`}>event page</Link> and use “Check your booking status”.</>;
}

function RefundNote({ booking: b }: { booking: EventBooking }) {
  const r = b.refund;
  const who = b.cancelled_by_customer ? "You cancelled this booking" : "This booking was cancelled by our team";
  if (!r) return <p className="ac-caption ac-note">{who}{b.cancelled_at ? ` on ${longDate(b.cancelled_at)}` : ""}. No refund is due.</p>;
  return (
    <p className="ac-caption ac-note">
      {who}. {r.status === "DUE" && <>Refund of <strong>{money(r.amount)}</strong>: our team will send it to you by UPI and message you on WhatsApp.</>}
      {r.status === "SENT" && <>Refund of <strong>{money(r.amount)}</strong> sent{r.recorded_at ? ` on ${longDate(r.recorded_at)}` : ""}{r.upi_reference ? ` (UPI ref ${r.upi_reference})` : ""}.</>}
      {r.status === "NOT_REFUNDED" && <>No refund was sent. Message us on WhatsApp if you have a question.</>}
    </p>
  );
}

function CancelBox({ booking: b, onChanged }: { booking: EventBooking; onChanged: (booking: EventBooking) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const c = b.cancellation!;

  if (!c.allowed) {
    return <p className="ac-caption ac-note">Online cancellation has closed for this event. Message us on WhatsApp if your plans change.</p>;
  }

  async function cancel() {
    setBusy(true); setError("");
    try { onChanged(await customerApi.cancelEventBooking(b.reference, reason.trim())); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't cancel. Please try again."); setBusy(false); }
  }

  const refund = !c.paid ? "Nothing has been paid, so there is nothing to refund."
    : Number(c.refund_amount) > 0 ? <>You'll get <strong>{money(c.refund_amount)}</strong> back ({c.refund_percent}%), sent by UPI by our team.</>
    : "Under this event's refund policy, cancelling now gives no refund.";

  return (
    <div className="ac-cancel">
      {!confirming ? (
        <>
          <button type="button" className="ac-danger" onClick={() => setConfirming(true)}>Cancel this booking</button>
          <p className="ac-caption">You can cancel online until {longDate(c.until)} · {time(c.until)}.</p>
        </>
      ) : (
        <>
          <label htmlFor={`er-${b.reference}`}>Reason (optional)</label>
          <input id={`er-${b.reference}`} value={reason} maxLength={255} onChange={(e) => setReason(e.target.value)} />
          <p className="ac-caption">{refund} Your places will be released.</p>
          <div className="ac-actions">
            <button type="button" className="ac-btn is-danger" disabled={busy} onClick={cancel}>{busy ? "Cancelling…" : "Yes, cancel it"}</button>
            <button type="button" className="ac-btn" disabled={busy} onClick={() => setConfirming(false)}>Keep it</button>
          </div>
          {error && <p className="ac-error" role="alert">{error}</p>}
        </>
      )}
    </div>
  );
}
