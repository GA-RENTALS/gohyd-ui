"use client";
import { useState } from "react";
import { customerApi } from "@/lib/customer/api";
import { longDate, money, time as timeLower } from "@/lib/customer/format";

const time = (iso: string) => timeLower(iso).toUpperCase();
import type { EventSchedule } from "@/lib/customer/types";

function isoDateInHyderabad(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Kolkata",
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function scheduleLabel(schedule: EventSchedule) {
  const start = new Date(schedule.starts_at);
  const end = schedule.ends_at ? new Date(schedule.ends_at) : null;
  const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  const startLabel = end && date.format(start) !== date.format(end)
    ? `${date.format(start)} – ${date.format(end)}`
    : longDate(schedule.starts_at);
  if (schedule.time_tbd) return `${startLabel} · Time to be confirmed`;
  return `${startLabel} · ${time(schedule.starts_at)}${schedule.ends_at ? ` – ${time(schedule.ends_at)}` : ""}`;
}

/** Event requests go to CRM; staff confirm and reserve places separately. */
export function EventEnquiryPanel({
  slug, eventSlug, title, price, schedules, whatsappNumber, venue,
}: {
  slug: string;
  eventSlug?: string;
  title: string;
  price: string | null;
  schedules: EventSchedule[];
  whatsappNumber: string;
  venue: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [scheduleId, setScheduleId] = useState(schedules[0]?.id ?? "");
  const [count, setCount] = useState(1);
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const selected = schedules.find((schedule) => schedule.id === scheduleId);
  const isFixedDate = schedules.length === 1 && schedules[0].is_date_locked;
  /** No dates yet (an upcoming plan): collect interest instead of asking the visitor to pick a date. */
  const upcoming = schedules.length === 0;
  const maxAttendees = selected?.capacity ?? 30;
  const whatsAppDigits = whatsappNumber.replace(/\D/g, "");

  function whatsAppMessage() {
    const requestedDate = selected ? scheduleLabel(selected) : "Date to be announced";
    return [
      `Event registration request: ${title} (${slug})`,
      `Date: ${requestedDate}`,
      venue ? `Location: ${venue}` : "",
      `Attendees: ${count}`,
      price !== null ? `Entry fee: ${money(price)} per person` : "",
      name.trim() ? `Name: ${name.trim()}` : "",
      phone.trim() ? `Phone: ${phone.trim()}` : "",
      message.trim() ? `Note: ${message.trim()}` : "",
    ].filter(Boolean).join("\n");
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const requestedDate = selected ? scheduleLabel(selected) : "Upcoming (no date yet)";
    const details = [
      `Event booking request: ${title} (${slug})`,
      `Requested date: ${requestedDate}`,
      `Group size: ${count}`,
      message.trim() ? `Customer note: ${message.trim()}` : "",
    ].filter(Boolean).join("\n");

    setBusy(true);
    try {
      await customerApi.submitEventEnquiry({
        name: name.trim(),
        phone: phone.trim(),
        ...(eventSlug ? { event: eventSlug } : {}),
        ...(eventSlug && selected ? { event_schedule: selected.id } : {}),
        ...(selected && !eventSlug ? { preferred_date: isoDateInHyderabad(selected.starts_at) } : {}),
        group_size: count,
        source: "website",
        message: details,
        consent_to_contact: consent,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send your request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="bk-card bk-sticky" id="book" role="status">
        <h2>Request received</h2>
        <p className="bk-note">Our team will contact you to confirm the date, price, and available places. Your place is not reserved yet.</p>
        {whatsAppDigits && <a className="btn event-whatsapp" href={`https://wa.me/${whatsAppDigits}?text=${encodeURIComponent(whatsAppMessage())}`} target="_blank" rel="noreferrer">Continue on WhatsApp</a>}
      </div>
    );
  }

  return (
    <form className="bk-card bk-sticky" id="book" onSubmit={submit}>
      <h2>{upcoming ? "Register your interest" : "Book your slot"}</h2>
      <p className="bk-note">{upcoming
        ? "Upcoming — dates and price will be announced soon. Leave your details and we'll message you first."
        : "Send your registration request. Our team will confirm your place."}</p>
      <div className="bk-total"><span>Entry fee per person</span><strong>{price !== null ? money(price) : "To be confirmed"}</strong></div>

      {isFixedDate ? (
        <div className="bk-field">
          <label htmlFor="event-date">Fixed event date</label>
          <input id="event-date" value={scheduleLabel(schedules[0])} readOnly aria-readonly="true" />
        </div>
      ) : schedules.length > 0 ? (
        <div className="bk-field">
          <label htmlFor="event-date">Event dates</label>
          <select id="event-date" value={scheduleId} onChange={(e) => setScheduleId(e.target.value)} required>
            {schedules.map((schedule) => <option key={schedule.id} value={schedule.id}>{scheduleLabel(schedule)}</option>)}
          </select>
        </div>
      ) : null}

      <div className="bk-field">
        <label htmlFor="event-guests">Attendees</label>
        <input id="event-guests" type="number" min={1} max={maxAttendees} value={count} onChange={(e) => setCount(Math.max(1, Math.min(maxAttendees, Number(e.target.value) || 1)))} required />
        {selected?.capacity && <span className="bk-hint">Up to {selected.capacity} attendees per request. Final availability is confirmed by the team.</span>}
      </div>
      <div className="bk-field">
        <label htmlFor="event-name">Your name</label>
        <input id="event-name" autoComplete="name" maxLength={150} value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="bk-field">
        <label htmlFor="event-phone">Phone number</label>
        <input id="event-phone" type="tel" autoComplete="tel" maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>
      <div className="bk-field">
        <label htmlFor="event-note">Anything else? <span className="bk-label-optional">Optional</span></label>
        <textarea id="event-note" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>
      <label className="bk-check">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
        <span>GoHyderabad may contact me about this request.</span>
      </label>
      {error && <p className="bk-error" role="alert">{error}</p>}
      <button type="submit" className="btn" disabled={busy} style={{ marginTop: 16 }}>
        {busy ? "Sending…" : upcoming ? "Register interest" : "Book now"}
      </button>
      {whatsAppDigits && <a className="btn event-whatsapp" href={`https://wa.me/${whatsAppDigits}?text=${encodeURIComponent(whatsAppMessage())}`} target="_blank" rel="noreferrer">Register on WhatsApp</a>}
      <p className="bk-hint" style={{ marginBottom: 0 }}>{upcoming
        ? "This doesn't book a place or take payment. We'll contact you when dates are announced."
        : "This sends a request for staff confirmation. It does not hold a slot or take payment."}</p>
    </form>
  );
}
