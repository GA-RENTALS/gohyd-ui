"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { customerApi } from "@/lib/customer/api";
import { longDate, money, statusLabel } from "@/lib/customer/format";
import { payWithRazorpay } from "@/lib/customer/razorpay";
import type { Checkout, Participant } from "@/lib/customer/types";
import { useCustomer } from "./CustomerProvider";
import { blankPerson, ParticipantsForm } from "./ParticipantsForm";

/** Shown when the payment gateway isn't set up: never leak the technical reason to a customer. */
const PAYMENT_UNAVAILABLE = "Online payment isn't available right now. Your booking is saved. Please message GoHyderabad on Instagram to complete your payment.";
const friendly = (message: string) => (/razorpay|gateway|not configured/i.test(message) ? PAYMENT_UNAVAILABLE : message);

export function CheckoutView({ id }: { id: string }) {
  const { user } = useCustomer();
  const [order, setOrder] = useState<Checkout | null>(null);
  const [people, setPeople] = useState<Record<string, Participant[]>>({});
  const [waiver, setWaiver] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "working" | "paid">("loading");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const co = await customerApi.checkout(id);
      setOrder(co);
      setPeople((prev) => {
        const next: Record<string, Participant[]> = {};
        for (const b of co.bookings) {
          const saved = b.participants.length ? b.participants : [];
          const rows = Array.from({ length: b.participant_count }, (_, i) => prev[b.id]?.[i] ?? saved[i] ?? (i === 0 ? { ...blankPerson(), full_name: user?.full_name ?? "", phone: user?.phone_number ?? "" } : blankPerson()));
          next[b.id] = rows;
        }
        return next;
      });
      setState(co.bookings.every((b) => Number(b.paid) > 0) ? "paid" : "ready");
    } catch (e: any) {
      setError(e.status === 404 ? "We couldn't find this checkout." : e.message);
      setState("ready");
    }
  }, [id, user]);

  useEffect(() => { void load(); }, [load]);

  async function pay() {
    if (!order) return;
    setError("");
    for (const b of order.bookings) {
      if ((people[b.id] ?? []).some((p) => !p.full_name.trim())) { setError("Please enter a name for everyone on the booking."); return; }
    }
    if (!waiver) { setError("Please accept the safety waiver to continue."); return; }
    setState("working");
    try {
      for (const b of order.bookings) {
        await customerApi.saveParticipants(b.id, (people[b.id] ?? []).map((p) => ({ ...p, full_name: p.full_name.trim(), age: p.age ?? null })));
        await customerApi.acceptWaiver(b.id);
      }
      const payment = await customerApi.startPayment(order.id, "ADVANCE");
      const paid = await payWithRazorpay(payment, { name: user?.full_name, contact: user?.phone_number, email: user?.email ?? undefined }, `Advance for ${order.bookings.map((b) => b.trip_title).join(", ")}`);
      await customerApi.confirmPayment(order.id, payment.payment, paid.razorpay_payment_id, paid.razorpay_signature);
      await load();
      setState("paid");
    } catch (e: any) {
      setError(friendly(e.message || "Something went wrong. Please try again."));
      setState("ready");
    }
  }

  if (state === "loading") return <p className="bk-note" role="status">Loading your booking…</p>;
  if (!order) return <p className="bk-error" role="alert">{error || "Something went wrong."}</p>;

  if (state === "paid") {
    return (
      <div className="bk-narrow">
        <div className="eyebrow">Booking confirmed</div>
        <h1 className="bk-title">You're <em>in.</em></h1>
        <div className="bk-card" style={{ marginTop: 24 }}>
          {order.bookings.map((b) => (
            <div key={b.id} className="bk-booking">
              <h3>{b.trip_title}</h3>
              <dl className="bk-dl">
                <div><dt>Reference</dt><dd>{b.reference}</dd></div>
                <div><dt>Date</dt><dd>{longDate(b.starts_at)}</dd></div>
                <div><dt>People</dt><dd>{b.participant_count}</dd></div>
                <div><dt>Paid</dt><dd>{money(b.paid)}</dd></div>
                <div><dt>Still to pay</dt><dd>{money(b.outstanding)}</dd></div>
              </dl>
            </div>
          ))}
          <p className="bk-note" style={{ marginTop: 16 }}>The balance is due before the trip. You can pay it any time from your account.</p>
          <Link className="btn" href="/account" style={{ marginTop: 16 }}>Go to my bookings</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bk-detail" style={{ marginTop: 0 }}>
      <div>
        <div className="eyebrow">Checkout</div>
        <h1 className="bk-title">Almost <em>there.</em></h1>
        <p className="bk-note">Reference {order.reference}</p>
        {order.bookings.map((b) => (
          <div className="bk-card" key={b.id} style={{ marginTop: 20 }}>
            <h2>Who's coming on {b.trip_title}?</h2>
            <ParticipantsForm idPrefix={b.id} people={people[b.id] ?? []} onChange={(next) => setPeople((p) => ({ ...p, [b.id]: next }))} />
          </div>
        ))}
        <div className="bk-card">
          <label className="bk-check">
            <input type="checkbox" checked={waiver} onChange={(e) => setWaiver(e.target.checked)} />
            <span>I confirm that everyone on this booking has read and accepts GoHyderabad's participation waiver and safety guidelines, and that the details above are correct.</span>
          </label>
        </div>
      </div>

      <aside className="bk-card bk-sticky" aria-label="Order summary">
        <h2>Summary</h2>
        {order.bookings.map((b) => (
          <div key={b.id} style={{ marginBottom: 14 }}>
            <strong>{b.trip_title}</strong>
            <p className="bk-note" style={{ margin: "4px 0 0" }}>{longDate(b.starts_at)} · {b.participant_count} {b.participant_count === 1 ? "person" : "people"} · {statusLabel(b.status)}</p>
          </div>
        ))}
        {Number(order.bookings[0]?.tax_amount) > 0 && <div className="bk-total" style={{ borderTop: 0, margin: 0 }}><span>Includes tax</span><span>{money(order.bookings.reduce((a, b) => a + Number(b.tax_amount), 0))}</span></div>}
        <div className="bk-total"><span>Total</span><strong>{money(order.total_amount)}</strong></div>
        <div className="bk-total" style={{ borderTop: 0, margin: "0 0 16px" }}><span>Due now (advance)</span><strong>{money(order.advance_total)}</strong></div>
        {error && <p className="bk-error" role="alert">{error}</p>}
        <button type="button" className="btn" disabled={state === "working"} onClick={pay} style={{ marginTop: 12 }}>
          {state === "working" ? "Please wait…" : `Pay ${money(order.advance_total)} to confirm`}
        </button>
        <p className="bk-hint" style={{ marginTop: 10 }}>Secure payment by Razorpay (UPI, cards, netbanking).</p>
      </aside>
    </div>
  );
}
