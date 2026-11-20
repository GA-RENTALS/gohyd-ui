"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCustomer } from "@/components/booking/CustomerProvider";
import { EventCouponBox } from "@/components/booking/EventCouponBox";
import { useT } from "@/components/site/LangProvider";
import { track, trackWhatsApp } from "@/lib/analytics";
import { customerApi } from "@/lib/customer/api";
import { openCashfreeCheckout, THANK_YOU_PATH } from "@/lib/customer/cashfree";
import { longDate, money, time as timeLower } from "@/lib/customer/format";
import type { CouponPreview, EventBooking, EventRegistrationType, EventSchedule } from "@/lib/customer/types";

const time = (iso: string) => timeLower(iso).toUpperCase();
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

/** Sends the customer to Cashfree for what the booking can pay now. Cashfree returns them to their account. */
async function payOnline(booking: EventBooking) {
  if (!booking.pay_now) return;
  const session = await customerApi.createPaymentOrder({ event_booking: booking.reference }, booking.pay_now.kind);
  await openCashfreeCheckout(session);
}

/** A booking that was made but not paid yet (the payment page couldn't open), or a free booking that is confirmed. */
function BookingResult({ booking, onReset }: { booking: EventBooking; onReset: () => void }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function pay() {
    setBusy(true); setError("");
    try { await payOnline(booking); }
    catch (err) { setError(err instanceof Error ? err.message : "The payment page didn't open. Please try again."); setBusy(false); }
  }
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
      {booking.pay_now ? (
        <>
          <p className="bk-hint">Pay {money(booking.pay_now.amount)} online to confirm your places. They are held until then.</p>
          {error && <p className="bk-error" role="alert">{error}</p>}
          <button type="button" className="btn" disabled={busy} onClick={pay}>{busy ? "Opening payment…" : `Pay ${money(booking.pay_now.amount)}`}</button>
        </>
      ) : (
        <p className="bk-hint">{booking.status === "CONFIRMED" ? "You're in! Your booking is confirmed. See you there." : "This booking is no longer active."}</p>
      )}
      <p className="bk-hint"><Link href="/account">See all your bookings</Link></p>
      <button type="button" className="bk-linkbtn" onClick={onReset}>Make another booking</button>
    </div>
  );
}

/**
 * "Reserve your spot" panel. Booking needs a signed-in account. The server re-checks capacity, registration type and
 * price, holds the places, and the customer pays the advance on Cashfree; a verified payment confirms the booking.
 */
export function EventBookingPanel({
  slug, title, price, schedules, whatsappNumber, venue, registrationType, maxPerBooking, holdMinutes, advancePercent,
}: {
  slug: string;
  title: string;
  price: string | null;
  schedules: EventSchedule[];
  whatsappNumber: string;
  venue: string;
  registrationType: EventRegistrationType;
  maxPerBooking: number | null;
  /** How long places stay held while the customer pays. */
  holdMinutes: number;
  /** Share of the price paid online when booking (100 = all of it). */
  advancePercent: number;
}) {
  const t = useT();
  const { user, loading } = useCustomer();
  const router = useRouter();
  const minCount = registrationType === "GROUP" ? 2 : 1;
  const [scheduleId, setScheduleId] = useState(schedules[0]?.id ?? "");
  const [count, setCount] = useState(minCount);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<EventBooking | null>(null);
  const [seatsOverride, setSeatsOverride] = useState<Record<string, number | null>>({});
  const [coupon, setCoupon] = useState<CouponPreview | null>(null);

  const selected = schedules.find((s) => s.id === scheduleId);
  const capacity = selected?.capacity ?? null;
  const seatsLeft = selected ? (selected.id in seatsOverride ? seatsOverride[selected.id] : selected.seats_left) : null;
  const soldOut = seatsLeft !== null && seatsLeft <= 0;
  const maxCount = registrationType === "INDIVIDUAL" ? 1 : Math.max(1, Math.min(seatsLeft ?? 50, maxPerBooking ?? 50));
  const groupBlocked = registrationType === "GROUP" && maxCount < 2;
  const participants = Math.min(Math.max(count, minCount), maxCount);
  const unit = price === null ? null : Number(price);
  const listTotal = unit === null ? null : unit * participants;
  const total = listTotal === null ? null : Math.max(0, listTotal - Number(coupon?.discount ?? 0));
  const advance = total === null ? null : Math.round(total * Math.min(100, advancePercent)) / 100;
  const bookerName = name.trim();

  const registerText = [
    `Hello GoHyderabad, I would like to register for ${title}${selected ? ` on ${fullDate(selected.starts_at)}` : ""}.`,
    venue ? `Location: ${venue}.` : "",
    `Participants: ${participants}.`,
    bookerName ? `Name: ${bookerName}.` : "",
    total !== null ? `Estimated total: ${money(total)}.` : "",
    "Please confirm availability.",
  ].filter(Boolean).join(" ");
  const waRegister = whatsAppLink(whatsappNumber, registerText);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setError(""); setBusy(true);
    let made: EventBooking | null = null;
    try {
      made = await customerApi.createEventBooking({
        event: slug, schedule: selected.id, name: bookerName, participant_count: participants, note: note.trim(),
        coupon: coupon?.code, consent_to_contact: consent,
      });
      setSeatsOverride((prev) => ({ ...prev, [selected.id]: made!.seats_left }));
      track("event_booking_request", { currency: "INR", value: total ?? 0, event_slug: slug, participants, has_coupon: Boolean(coupon) });
      if (made.pay_now) {
        await payOnline(made);     // leaves the page for Cashfree, which brings the customer to the thank-you page
        return;
      }
      if (made.status === "CONFIRMED") {
        router.push(`${THANK_YOU_PATH}?event=${made.reference}`);   // free: nothing to pay, confirmed at once
        return;
      }
      setBooking(made);
    } catch (err) {
      // The booking may exist with its places held: show it, with a Pay button to try the payment again.
      if (made) setBooking(made);
      setError(err instanceof Error ? err.message : "We couldn't make your booking. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const reset = () => { setBooking(null); setConsent(false); setCoupon(null); setError(""); };

  return (
    <div className="bk-card bk-sticky" id="book">
      {booking ? (
        <>
          <h2>{booking.status === "CONFIRMED" ? "You're booked" : "Booking made"}</h2>
          {error && <p className="bk-error" role="alert">{error}</p>}
          <BookingResult key={booking.reference} booking={booking} onReset={reset} />
        </>
      ) : (
        <>
          <h2>{t("Book your slot")}</h2>
          <p className="bk-note">{t("Register yourself or bring your friends along.")}</p>
          <div className="bk-total"><span>{t("Entry fee per person")}</span><strong>{price !== null ? money(price) : "TBC"}</strong></div>

          {capacity !== null && (
            <p className={`bk-slots${soldOut ? " is-full" : seatsLeft !== null && seatsLeft <= 5 ? " is-low" : ""}`}>
              {seatsLeft === null ? `Capacity: ${capacity} total` : soldOut ? "Fully booked" : `${seatsLeft} of ${capacity} slots left`}
            </p>
          )}

          {!schedules.length ? (
            <>
              <p className="bk-hint">Upcoming — dates will be announced soon. Message us to register your interest.</p>
              {waRegister && <a className="btn event-whatsapp" href={waRegister} target="_blank" rel="noreferrer"
                onClick={() => trackWhatsApp("event_interest", slug)}>Register interest on WhatsApp</a>}
            </>
          ) : soldOut || groupBlocked ? (
            <>
              <p className="bk-hint">All slots for this date are taken or held. Unpaid holds are released after {holdMinutes} minutes, so check back or ask the team about a waiting list.</p>
              {waRegister && <a className="btn event-whatsapp" href={waRegister} target="_blank" rel="noreferrer"
                onClick={() => trackWhatsApp("event_waitlist", slug)}>Join the waiting list on WhatsApp</a>}
            </>
          ) : !user ? (
            <>
              <p className="bk-hint">Sign in with your WhatsApp number to book and pay online. Your bookings and receipts stay in your account.</p>
              <Link className="btn" href={`/login?next=${encodeURIComponent(`/events/${slug}#book`)}`} aria-disabled={loading}>Sign in to book</Link>
              {waRegister && <a className="btn event-whatsapp" href={waRegister} target="_blank" rel="noreferrer"
                onClick={() => trackWhatsApp("event_register_form", slug)}>{t("Register on WhatsApp")}</a>}
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
                  : `${capacity !== null ? `Maximum total event capacity is ${capacity}. ` : ""}Group bookings are subject to remaining slots${seatsLeft !== null ? ` (up to ${maxCount} now)` : ""}.`}
              </p>
              <div className="bk-field">
                <label htmlFor="name">{participants > 1 ? t("Primary participant name") : t("Your name")}</label>
                <input id="name" type="text" autoComplete="name" maxLength={150} placeholder={t("Enter your full name")}
                  value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <p className="bk-hint">Booking updates go to {user.phone_number} on WhatsApp.</p>
              <div className="bk-field">
                <label htmlFor="notes">{t("Anything else?")} <span className="bk-label-optional">{t("Optional")}</span></label>
                <textarea id="notes" maxLength={1000} placeholder={t("Add a note for the event team")} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              {unit !== null && unit > 0 && <EventCouponBox event={slug} participants={participants} phone={user.phone_number} applied={coupon} onChange={setCoupon} />}
              <div className="bk-total"><span>Total{participants > 1 && unit !== null ? ` (${participants} × ${money(unit)}${coupon ? ` − ${money(coupon.discount)}` : ""})` : ""}</span><strong>{total !== null ? money(total) : "TBC"}</strong></div>
              {advance !== null && total !== null && total > 0 && advancePercent < 100 && (
                <div className="bk-total" style={{ borderTop: 0 }}><span>Pay now to confirm ({advancePercent}%)</span><strong>{money(advance)}</strong></div>
              )}
              <label className="bk-check">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
                <span>GoHyderabad may contact me about this booking. I agree to the <a href="/terms" target="_blank" rel="noopener">terms</a> and the <a href="/refund-policy" target="_blank" rel="noopener">cancellation and refund policy</a>.</span>
              </label>
              {error && <p className="bk-error" role="alert">{error}</p>}
              <button className="btn" type="submit" disabled={busy}>
                {busy ? t("Please wait…") : total === 0 ? "Confirm free booking" : `Book and pay ${money(advancePercent < 100 && advance !== null ? advance : total ?? 0)}`}
              </button>
              <p className="bk-hint">
                {total === 0
                  ? "Nothing to pay: your places are confirmed straight away."
                  : `Your places are held for ${holdMinutes} minutes while you pay securely with Cashfree (UPI, cards, netbanking). Paying confirms your booking.${advancePercent < 100 ? " The rest can be paid later from your account." : ""}`}
              </p>
            </form>
          )}
        </>
      )}
    </div>
  );
}
