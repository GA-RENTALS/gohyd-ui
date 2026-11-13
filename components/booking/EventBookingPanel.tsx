"use client";
import { useT } from "@/components/site/LangProvider";
import { useState } from "react";
import { customerApi } from "@/lib/customer/api";
import { longDate, money, time as timeLower } from "@/lib/customer/format";
import { FEATURED_EVENT_SLUG, FEATURED_EVENT_UPI_QR } from "@/components/site/data/featured-event";

const time = (iso: string) => timeLower(iso).toUpperCase();
import type { EventBooking, EventPayment, EventRegistrationType, EventSchedule } from "@/lib/customer/types";

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

const PAYMENT_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PAYMENT_MAX_BYTES = 5 * 1024 * 1024;

function upiLink(p: EventPayment, amount: string, reference: string) {
  if (!p.upi_id) return "";
  const q = new URLSearchParams({ pa: p.upi_id, cu: "INR", am: Number(amount).toFixed(2), tn: reference });
  if (p.payee_name) q.set("pn", p.payee_name);
  return `upi://pay?${q.toString()}`;
}

/** Pay by UPI QR, then upload the payment screenshot. The team checks it before confirming the booking. */
function PaymentStep({ booking, phone, onUploaded }: { booking: EventBooking; phone: string; onUploaded: (b: EventBooking) => void }) {
  const p = booking.payment!;
  const [file, setFile] = useState<File | null>(null);
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [replacing, setReplacing] = useState(false);
  const [copied, setCopied] = useState(false);
  const upi = upiLink(p, booking.total_amount, booking.reference);
  const qr = p.qr_url || (booking.event_slug === FEATURED_EVENT_SLUG ? FEATURED_EVENT_UPI_QR : null);

  function choose(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setError("");
    if (f && !PAYMENT_TYPES.includes(f.type)) { setError("Choose a JPG, PNG or WebP screenshot."); setFile(null); return; }
    if (f && f.size > PAYMENT_MAX_BYTES) { setError("The screenshot must be smaller than 5 MB."); setFile(null); return; }
    setFile(f);
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Choose the screenshot of your payment."); return; }
    setBusy(true); setError("");
    try {
      onUploaded(await customerApi.uploadEventPayment(booking.reference, phone, file, utr.trim()));
      setReplacing(false); setFile(null); setUtr("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't upload your screenshot. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copyUpi() {
    try { await navigator.clipboard.writeText(p.upi_id); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  if (booking.payment_submitted && !replacing) {
    return (
      <div className="bk-pay">
        <p className="bk-pay-done">Payment screenshot received. The team will check it and confirm your booking on WhatsApp.</p>
        <button type="button" className="bk-linkbtn" onClick={() => setReplacing(true)}>Upload a different screenshot</button>
      </div>
    );
  }

  return (
    <form className="bk-pay" onSubmit={upload}>
      <h3>Pay {money(booking.total_amount)} to confirm</h3>
      <ol className="bk-pay-steps">
        <li>{qr ? "Scan the QR code" : "Pay to the UPI ID below"} with any UPI app (GPay, PhonePe, Paytm) and pay <strong>{money(booking.total_amount)}</strong>.</li>
        <li>Take a screenshot of the payment.</li>
        <li>Upload it below.</li>
      </ol>
      {qr && (
        <a href={qr} target="_blank" rel="noreferrer" className="bk-pay-qr">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt={`UPI QR code${p.payee_name ? ` for ${p.payee_name}` : ""}`} />
        </a>
      )}
      {(p.upi_id || p.payee_name) && (
        <dl className="bk-booking-facts">
          {p.payee_name && <><dt>Paying to</dt><dd>{p.payee_name}</dd></>}
          {p.upi_id && <><dt>UPI ID</dt><dd><strong>{p.upi_id}</strong> <button type="button" className="bk-linkbtn" onClick={copyUpi}>{copied ? "Copied" : "Copy"}</button></dd></>}
        </dl>
      )}
      {upi && <a className="btn btn-ghost bk-pay-app" href={upi}>Open UPI app on this phone</a>}
      <div className="bk-field">
        <label htmlFor={`pay-shot-${booking.reference}`}>Payment screenshot</label>
        <input id={`pay-shot-${booking.reference}`} type="file" accept="image/png,image/jpeg,image/webp" onChange={choose} required />
      </div>
      <div className="bk-field">
        <label htmlFor={`pay-utr-${booking.reference}`}>UPI transaction ID <span className="bk-label-optional">(optional)</span></label>
        <input id={`pay-utr-${booking.reference}`} inputMode="numeric" maxLength={40} placeholder="12-digit UTR number" value={utr} onChange={(e) => setUtr(e.target.value)} />
      </div>
      {error && <p className="bk-error" role="alert">{error}</p>}
      <button type="submit" className="btn" disabled={busy}>{busy ? "Uploading…" : "Upload screenshot"}</button>
      {replacing && <button type="button" className="bk-linkbtn" onClick={() => setReplacing(false)}>Keep the earlier screenshot</button>}
    </form>
  );
}

function BookingResult({ booking: initial, phone, onReset }: { booking: EventBooking; phone: string; onReset?: () => void }) {
  const [booking, setBooking] = useState(initial);
  const t = useT();
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
      <div className={`bk-status bk-status-${booking.status.toLowerCase()}`}>{booking.status_label}</div>
      <dl className="bk-booking-facts">
        <dt>Booking reference</dt><dd><strong>{booking.reference}</strong></dd>
        <dt>{t("Date")}</dt><dd>{longDate(booking.starts_at)}{booking.time_tbd ? "" : ` · ${time(booking.starts_at)}`}</dd>
        <dt>Participants</dt><dd>{booking.participant_count}</dd>
        <dt>{t("Total")}</dt><dd>{money(booking.total_amount)}</dd>
        {booking.status === "PENDING" && booking.reserved_until && (
          <><dt>Held until</dt><dd>{longDate(booking.reserved_until)} · {time(booking.reserved_until)}</dd></>
        )}
      </dl>
      <p className="bk-hint">{STATUS_NOTE[booking.status]}</p>
      {booking.payment && (booking.status === "PENDING" || booking.status === "CONFIRMED") && (
        <PaymentStep booking={booking} phone={phone} onUploaded={setBooking} />
      )}
      {wa && booking.status === "PENDING" && (
        <a className="btn event-whatsapp" href={wa} target="_blank" rel="noreferrer">Confirm on WhatsApp</a>
      )}
      <p className="bk-hint">Save your reference to check the status later with the same mobile number.</p>
      {onReset && <button type="button" className="bk-linkbtn" onClick={onReset}>Make another booking</button>}
    </div>
  );
}

function StatusLookup() {
  const t = useT();
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

  if (!open) return <button type="button" className="bk-linkbtn" onClick={() => setOpen(true)}>{t("Already booked? Check your booking status")}</button>;
  return (
    <form className="bk-lookup" onSubmit={lookUp}>
      <h3>Check booking status</h3>
      <div className="bk-field">
        <label htmlFor="lookup-ref">Booking reference</label>
        <input id="lookup-ref" placeholder="GHE-XXXXXX" value={reference} onChange={(e) => setReference(e.target.value)} required maxLength={16} />
      </div>
      <div className="bk-field">
        <label htmlFor="lookup-phone">Mobile number used to book</label>
        <input id="lookup-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={20} />
      </div>
      {error && <p className="bk-error" role="alert">{error}</p>}
      <button type="submit" className="btn btn-ghost" disabled={busy}>{busy ? "Checking…" : "Check status"}</button>
      {booking && <div style={{ marginTop: 16 }}><BookingResult key={booking.reference} booking={booking} phone={phone} /></div>}
    </form>
  );
}

/**
 * "Reserve your spot" panel. The server re-checks capacity, registration type and price, and returns a PENDING
 * booking with a reference; staff confirm it in the admin panel.
 */
export function EventBookingPanel({
  slug, title, price, schedules, whatsappNumber, venue, registrationType, maxPerBooking, holdHours, takesUpiPayment = false,
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
  /** The event shows a UPI QR after booking and asks for a payment screenshot. */
  takesUpiPayment?: boolean;
}) {
  const t = useT();
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
    <div className="bk-card bk-sticky" id="book">
      {booking ? (
        <>
          <h2>Booking request received</h2>
          <BookingResult key={booking.reference} booking={booking} phone={phone} onReset={() => { setBooking(null); setConsent(false); }} />
        </>
      ) : (
        <>
          <h2>{t("Book your slot")}</h2>
          <p className="bk-note">{t("Register yourself or bring your friends along. Our team will confirm availability.")}</p>
          <div className="bk-total"><span>{t("Entry fee per person")}</span><strong>{price !== null ? money(price) : "TBC"}</strong></div>

          {capacity !== null && (
            <p className={`bk-slots${soldOut ? " is-full" : seatsLeft !== null && seatsLeft <= 5 ? " is-low" : ""}`}>
              {seatsLeft === null ? `Capacity: ${capacity} total` : soldOut ? "Fully booked" : `${seatsLeft} of ${capacity} slots left`}
            </p>
          )}

          {!schedules.length ? (
            <>
              <p className="bk-hint">Upcoming — dates will be announced soon. Message us to register your interest.</p>
              {waRegister && <a className="btn event-whatsapp" href={waRegister} target="_blank" rel="noreferrer">Register interest on WhatsApp</a>}
            </>
          ) : soldOut || groupBlocked ? (
            <>
              <p className="bk-hint">All slots for this date are taken or on hold. Unconfirmed holds are released after {holdHours} hours, so check back or ask the team about a waiting list.</p>
              {waRegister && <a className="btn event-whatsapp" href={waRegister} target="_blank" rel="noreferrer">Join the waiting list on WhatsApp</a>}
            </>
          ) : (
            <form onSubmit={submit}>
              <div className="bk-field">
                <label htmlFor="event-date">{t("Event date")}</label>
                {schedules.length === 1
                  ? <input id="event-date" value={scheduleLabel(schedules[0])} readOnly aria-readonly="true" />
                  : (
                    <select id="event-date" value={scheduleId} onChange={(e) => setScheduleId(e.target.value)} required>
                      {schedules.map((s) => <option key={s.id} value={s.id}>{scheduleLabel(s)}</option>)}
                    </select>
                  )}
              </div>
              <div className="bk-field">
                <label htmlFor="participants">{t("Number of participants")}</label>
                <input id="participants" type="number" inputMode="numeric" min={minCount} max={maxCount} value={participants}
                  readOnly={maxCount === minCount}
                  onChange={(e) => setCount(Math.max(minCount, Math.min(maxCount, Number(e.target.value) || minCount)))} required />
              </div>
              <p className="bk-hint">
                {registrationType === "INDIVIDUAL"
                  ? "Individual registrations only for this event."
                  : `${capacity !== null ? `Maximum total event capacity is ${capacity}. ` : ""}Group requests are subject to remaining slots${seatsLeft !== null ? ` (up to ${maxCount} now)` : ""}.`}
              </p>
              <div className="bk-field">
                <label htmlFor="name">{participants > 1 ? t("Primary participant name") : t("Your name")}</label>
                <input id="name" type="text" autoComplete="name" maxLength={150} placeholder={t("Enter your full name")} value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="bk-field">
                <label htmlFor="phone">{t("Mobile number")}</label>
                <input id="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={20} placeholder={t("Enter your mobile number")} value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="bk-field">
                <label htmlFor="email">{t("Email address")} <span className="bk-label-optional">{t("(optional)")}</span></label>
                <input id="email" type="email" autoComplete="email" placeholder={t("Enter your email")} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="bk-field">
                <label htmlFor="notes">{t("Anything else?")} <span className="bk-label-optional">{t("Optional")}</span></label>
                <textarea id="notes" maxLength={1000} placeholder={t("Add a note for the event team")} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <div className="bk-total"><span>Estimated total{participants > 1 && unit !== null ? ` (${participants} × ${money(unit)})` : ""}</span><strong>{total !== null ? money(total) : "TBC"}</strong></div>
              <label className="bk-check">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
                <span>{t("GoHyderabad may contact me about this registration request. I understand that submitting this form does not confirm my booking.")}</span>
              </label>
              {error && <p className="bk-error" role="alert">{error}</p>}
              <button className="btn" type="submit" disabled={busy}>{busy ? t("Sending…") : t("Request a booking")}</button>
              {waRegister && <a className="btn event-whatsapp" href={waRegister} target="_blank" rel="noreferrer">{t("Register on WhatsApp")}</a>}
              <p className="bk-hint">{takesUpiPayment
                ? `This holds your slots for up to ${holdHours} hours. Next you'll see a UPI QR code: pay the entry fee and upload the payment screenshot. Your slot is confirmed after the team checks your payment.`
                : `This submits a registration request and holds your slots for up to ${holdHours} hours. Your slot is confirmed after the event team verifies availability and sends confirmation. No payment is collected online.`}</p>
            </form>
          )}
        </>
      )}
      <StatusLookup />
    </div>
  );
}
