"use client";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { customerApi } from "@/lib/customer/api";
import { longDate, money } from "@/lib/customer/format";
import type { Invoice } from "@/lib/customer/types";

/** The issued GST invoice, laid out for printing. "Download PDF" uses the browser's Save as PDF. */
export function InvoiceView({ bookingId }: { bookingId: string }) {
  const [inv, setInv] = useState<Invoice | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { customerApi.bookingInvoice(bookingId).then(setInv).catch((e) => setError(e.message)); }, [bookingId]);

  if (error) return <div className="ac-panel"><p className="ac-error" role="alert">{error}</p><Link className="ac-btn" href="/account">Back to bookings</Link></div>;
  if (!inv) return <p className="ac-caption" role="status">Loading invoice…</p>;

  const rate = inv.tax?.enabled && inv.tax.rate_basis_points ? inv.tax.rate_basis_points / 100 : 0;
  return (
    <>
      <div className="inv-actions">
        <Link className="ac-btn" href="/account">Back to bookings</Link>
        <button type="button" className="ac-btn is-primary" onClick={() => window.print()}>Download PDF</button>
      </div>
      <article className="inv" aria-label={`Invoice ${inv.number}`}>
        <header className="inv-head">
          <div>
            <h1>Tax invoice</h1>
            <p><strong>{inv.seller.legal_name}</strong></p>
            {inv.seller.address && <p>{inv.seller.address}</p>}
            {inv.seller.gstin && <p>GSTIN: {inv.seller.gstin}</p>}
          </div>
          <dl>
            <dt>Invoice no.</dt><dd>{inv.number}</dd>
            <dt>Date</dt><dd>{longDate(inv.issued_at)}</dd>
            <dt>Booking</dt><dd>{inv.booking_reference}</dd>
          </dl>
        </header>
        <section className="inv-bill">
          <h2>Billed to</h2>
          <p>{inv.billing_name || "Customer"}</p>
          {inv.billing_address && <p>{inv.billing_address}</p>}
          {inv.billing_gstin && <p>GSTIN: {inv.billing_gstin}</p>}
        </section>
        <table className="inv-table">
          <thead><tr><th>Description</th><th>Qty</th><th>Unit (net)</th><th>Tax</th><th>Total</th></tr></thead>
          <tbody>
            {inv.items.map((it, i) => (
              <tr key={i}><td>{it.description}</td><td>{it.quantity}</td><td>{money(it.unit_amount)}</td><td>{money(it.tax_amount)}</td><td>{money(it.total)}</td></tr>
            ))}
          </tbody>
        </table>
        <dl className="inv-totals">
          {Number(inv.discount_amount) > 0 && <><dt>Coupon discount (before tax)</dt><dd>− {money(inv.discount_amount)}</dd></>}
          <dt>Taxable value</dt><dd>{money(inv.subtotal)}</dd>
          {rate > 0 && (inv.tax.components ?? []).map((c) => <Fragment key={c.name}><dt>{c.name} ({c.bp / 100}%)</dt><dd>{money((Number(inv.tax_amount) * c.bp) / (inv.tax.rate_basis_points ?? 1))}</dd></Fragment>)}
          <dt>Total tax</dt><dd>{money(inv.tax_amount)}</dd>
          <dt className="inv-grand">Total</dt><dd className="inv-grand">{money(inv.total)}</dd>
        </dl>
        {inv.tax?.sac_code && <p className="inv-note">SAC: {inv.tax.sac_code}</p>}
        <p className="inv-note">This is a computer-generated invoice.</p>
      </article>
    </>
  );
}
