"use client";
import Link from "next/link";
import { longDate, money, time } from "@/lib/customer/format";
import type { EventBooking } from "@/lib/customer/types";

const STATUS_CLASS: Record<EventBooking["status"], string> = {
  PENDING: "is-wait", CONFIRMED: "is-good", CANCELLED: "is-bad", EXPIRED: "is-bad",
};

/** Event registrations (no online payment): reference, date, people, total and where the request stands. */
export function EventBookingsList({ bookings }: { bookings: EventBooking[] }) {
  return (
    <div className="ac-list">
      {bookings.map((b) => (
        <article key={b.reference} className="ac-card is-event">
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
              {b.payment && <li>Payment screenshot: <strong>{b.payment_submitted ? "sent" : "not sent yet"}</strong></li>}
            </ul>
            <div className="ac-bottom">
              <span className="ac-price">{money(b.total_amount)}</span>
              <span className="ac-caption">{b.status === "PENDING"
                ? b.payment
                  ? b.payment_submitted ? "We're checking your payment and will confirm on WhatsApp." : <>To pay, open the <Link href={`/events/${b.event_slug}#book`}>event page</Link> and use “Check your booking status”.</>
                  : "Our team will confirm your place. Pay at the venue."
                : b.status === "CONFIRMED" ? "See you there!" : ""}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
