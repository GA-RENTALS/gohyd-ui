"use client";
import { useState } from "react";
import { customerApi } from "@/lib/customer/api";
import { longDate, money, time as timeLower } from "@/lib/customer/format";

const time = (iso: string) => timeLower(iso).toUpperCase();
import type { EventBooking, EventRegistrationType, EventSchedule } from "@/lib/customer/types";

const fullDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

function scheduleLabel(s: { starts_at: string; ends_at: string | null; time_tbd: boolean }) {
  if (s.time_tbd) return `${fullDate(s.starts_at)} · Time to be confirmed`;
  return `${fullDate(s.starts_at)} · ${time(s.starts_at)}${s.ends_at ? ` – ${time(s.ends_at)}` : ""}`;
}

function whatsAppLink(number: string, text: string) {
  const digits = number.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : "";
}

const STATUS_NOTE: Record<EventBooking["status"], string> = {
  PENDING: "Your slots are held while our team verifies availability. This is not a confirmed registration yet — we'll send a confirmation.",
  CONFIRMED: "You're in! Your registration is confirmed. See you there.",
  CANCELLED: "This booking was cancelled. Contact us on WhatsApp if this is unexpected.",
  EXPIRED: "The hold on these slots ran out before confirmation. Request again or message us on WhatsApp.",
};

function BookingResult({ booking, onReset }: { booking: EventBooking; onReset?: () => void }) {
  const confirmText = [
    `Hello GoHyderabad, please confirm my booking ${booking.reference}.`,
    `Event: ${booking.event_title}`,
    `Date: ${scheduleLabel(booking)}`,
    `Participants: ${booking.participant_count}`,
    `Total: ${money(booking.total_amount)}`,
    `Name: ${booking.contact_name}`,
  ].join("\n");
  const wa = whatsAppLink(booking.booking_whatsapp_number, confirmText);
  return (
    <div role="status">
      <div className={`evd-status evd-status-${booking.status.toLowerCase()}`}>{booking.status_label}</div>
      <dl className="evd-booking-facts">
        <dt>Booking reference</dt><dd><strong>{booking.reference}</strong></dd>
        <dt>Date</dt><dd>{longDate(booking.starts_at)}{booking.time_tbd ? "" : ` · ${time(booking.starts_at)}`}</dd>
        <dt>Participants</dt><dd>{booking.participant_count}</dd>
        <dt>Total</dt><dd>{money(booking.total_amount)}</dd>
        {booking.status === "PENDING" && booking.reserved_until && (
          <><dt>Held until</dt><dd>{longDate(booking.reserved_until)} · {time(booking.reserved_until)}</dd></>
        )}
      </dl>
      <p className="evd-booking-note">{STATUS_NOTE[booking.status]}</p>
      {wa && booking.status === "PENDING" && (
        <a className="evd-btn evd-btn-whatsapp" href={wa} target="_blank" rel="noreferrer">Confirm on WhatsApp</a>
      )}
      <p className="evd-booking-note">Save your reference to check the status later with the same mobile number.</p>
      {onReset && <button type="button" className="evd-linkbtn" onClick={onReset}>Make another booking</button>}
    </div>
  );
}

function StatusLookup() {
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<EventBooking | null>(null);

  async function lookUp(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBooking(null); setBusy(true);
    try { setBooking(await customerApi.eventBookingStatus(reference, phone)); }
    catch (err) { setError(err instanceof Error ? err.message : "We couldn't find that booking."); }
    finally { setBusy(false); }
  }

  if (!open) return <button type="button" className="evd-linkbtn" onClick={() => setOpen(true)}>Already booked? Check your booking status</button>;
  return (
    <form className="evd-lookup" onSubmit={lookUp}>
      <h3>Check booking status</h3>
      <div className="evd-field">
        <label htmlFor="lookup-ref">Booking reference</label>
        <input id="lookup-ref" placeholder="GHE-XXXXXX" value={reference} onChange={(e) => setReference(e.target.value)} required maxLength={16} />
      </div>
      <div className="evd-field">
        <label htmlFor="lookup-phone">Mobile number used to book</label>
        <input id="lookup-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={20} />
      </div>
      {error && <p className="evd-error" role="alert">{error}</p>}
      <button type="submit" className="evd-btn evd-btn-ghost" disabled={busy}>{busy ? "Checking…" : "Check status"}</button>
      {booking && <div style={{ marginTop: 16 }}><BookingResult booking={booking} /></div>}
    </form>
  );
}

/**
 * "Reserve your spot" panel. The server re-checks capacity, registration type and price, and returns a PENDING
 * booking with a reference; staff confirm it in the admin panel.
 */
export function EventBookingPanel({
  slug, title, price, schedules, whatsappNumber, venue, registrationType, maxPerBooking, holdHours,
}: {
  slug: string;
  title: string;
  price: string | null;
  schedules: EventSchedule[];
  whatsappNumber: string;
  venue: string;
  registrationType: EventRegistrationType;
  maxPerBooking: number | null;
  holdHours: number;
}) {
  const minCount = registrationType === "GROUP" ? 2 : 1;
  const [scheduleId, setScheduleId] = useState(schedules[0]?.id ?? "");
  const [count, setCount] = useState(minCount);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<EventBooking | null>(null);
  const [seatsOverride, setSeatsOverride] = useState<Record<string, number | null>>({});

  const selected = schedules.find((s) => s.id === scheduleId);
  const capacity = selected?.capacity ?? null;
  const seatsLeft = selected ? (selected.id in seatsOverride ? seatsOverride[selected.id] : selected.seats_left) : null;
  const soldOut = seatsLeft !== null && seatsLeft <= 0;
  const maxCount = registrationType === "INDIVIDUAL" ? 1 : Math.max(1, Math.min(seatsLeft ?? 50, maxPerBooking ?? 50));
  const groupBlocked = registrationType === "GROUP" && maxCount < 2;
  const participants = Math.min(Math.max(count, minCount), maxCount);
  const unit = price === null ? null : Number(price);
  const total = unit === null ? null : unit * participants;
  const takenPct = capacity && seatsLeft !== null ? Math.min(100, Math.round(((capacity - seatsLeft) / capacity) * 100)) : 0;

  const registerText = [
    `Hello GoHyderabad, I would like to register for ${title}${selected ? ` on ${fullDate(selected.starts_at)}` : ""}.`,
    venue ? `Location: ${venue}.` : "",
    `Participants: ${participants}.`,
    `Name: ${name.trim() || "Not provided"}.`,
    `Mobile: ${phone.trim() || "Not provided"}.`,
    total !== null ? `Estimated total: ${money(total)}.` : "",
    "Please confirm availability.",
  ].filter(Boolean).join(" ");
  const waRegister = whatsAppLink(whatsappNumber, registerText);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setError(""); setBusy(true);
    try {
      const result = await customerApi.createEventBooking({
        event: slug, schedule: selected.id, name: name.trim(), phone: phone.trim(), email: email.trim(),
        participant_count: participants, note: note.trim(), consent_to_contact: consent,
      });
      setSeatsOverride((prev) => ({ ...prev, [selected.id]: result.seats_left }));
      setBooking(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send your booking request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="evd-booking" id="book">
      {booking ? (
        <>
          <h2>Booking request received</h2>
          <BookingResult booking={booking} onReset={() => { setBooking(null); setConsent(false); }} />
        </>
      ) : (
        <>
          <h2>Reserve your spot</h2>
          <p className="evd-booking-intro">Register yourself or bring your friends along. Our team will confirm availability.</p>
          <div className="evd-price-line"><span>Entry fee per person</span><span className="evd-price">{price !== null ? money(price) : "TBC"}</span></div>

          {capacity !== null && (
            <>
              <div className="evd-capacity">
                <span>Event availability</span>
                <strong>{seatsLeft === null ? `Capacity: ${capacity} total` : soldOut ? "Fully booked" : `${seatsLeft} of ${capacity} slots left`}</strong>
              </div>
              <div className="evd-capacity-track" aria-hidden="true"><div className="evd-capacity-fill" style={{ width: `${takenPct}%` }} /></div>
            </>
          )}

          {!schedules.length ? (
            <>
              <p className="evd-booking-note">There are no open dates for this event right now.</p>
              {waRegister && <a className="evd-btn evd-btn-whatsapp" href={waRegister} target="_blank" rel="noreferrer">Ask on WhatsApp</a>}
            </>
          ) : soldOut || groupBlocked ? (
            <>
              <p className="evd-booking-note">All slots for this date are taken or on hold. Unconfirmed holds are released after {holdHours} hours, so check back or ask the team about a waiting list.</p>
              {waRegister && <a className="evd-btn evd-btn-whatsapp" href={waRegister} target="_blank" rel="noreferrer">Join the waiting list on WhatsApp</a>}
            </>
          ) : (
            <form onSubmit={submit}>
              <div className="evd-field">
                <label htmlFor="event-date">Event date</label>
                {schedules.length === 1
                  ? <input id="event-date" value={scheduleLabel(schedules[0])} readOnly aria-readonly="true" />
                  : (
                    <select id="event-date" value={scheduleId} onChange={(e) => setScheduleId(e.target.value)} required>
                      {schedules.map((s) => <option key={s.id} value={s.id}>{scheduleLabel(s)}</option>)}
                    </select>
                  )}
              </div>
              <div className="evd-field">
                <label htmlFor="participants">Number of participants</label>
                <input id="participants" type="number" inputMode="numeric" min={minCount} max={maxCount} value={participants}
                  readOnly={maxCount === minCount}
                  onChange={(e) => setCount(Math.max(minCount, Math.min(maxCount, Number(e.target.value) || minCount)))} required />
              </div>
              <p className="evd-hint">
                {registrationType === "INDIVIDUAL"
                  ? "Individual registrations only for this event."
                  : `${capacity !== null ? `Maximum total event capacity is ${capacity}. ` : ""}Group requests are subject to remaining slots${seatsLeft !== null ? ` (up to ${maxCount} now)` : ""}.`}
              </p>
              <div className="evd-field">
                <label htmlFor="name">{participants > 1 ? "Primary participant name" : "Your name"}</label>
                <input id="name" type="text" autoComplete="name" maxLength={150} placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="evd-field">
                <label htmlFor="phone">Mobile number</label>
                <input id="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={20} placeholder="Enter your mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="evd-field">
                <label htmlFor="email">Email address <span className="evd-optional">(optional)</span></label>
                <input id="email" type="email" autoComplete="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="evd-field">
                <label htmlFor="notes">Anything else? <span className="evd-optional">Optional</span></label>
                <textarea id="notes" maxLength={1000} placeholder="Add a note for the event team" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <div className="evd-total"><span>Estimated total{participants > 1 && unit !== null ? ` (${participants} × ${money(unit)})` : ""}</span><strong>{total !== null ? money(total) : "TBC"}</strong></div>
              <label className="evd-check">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
                <span>GoHyderabad may contact me about this registration request. I understand that submitting this form does not confirm my booking.</span>
              </label>
              {error && <p className="evd-error" role="alert">{error}</p>}
              <button className="evd-btn evd-btn-primary" type="submit" disabled={busy}>{busy ? "Sending…" : "Request a booking"}</button>
              {waRegister && <a className="evd-btn evd-btn-whatsapp" href={waRegister} target="_blank" rel="noreferrer">Register on WhatsApp</a>}
              <p className="evd-booking-note">This submits a registration request and holds your slots for up to {holdHours} hours. Your slot is confirmed after the event team verifies availability and sends confirmation. No payment is collected online.</p>
            </form>
          )}
        </>
      )}
      <StatusLookup />
    </aside>
  );
}
