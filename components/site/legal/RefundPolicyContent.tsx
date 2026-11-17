import Link from "next/link";

/**
 * Cancellation and refund policy, shown at /refund-policy until a "refund-policy" page is published under Admin →
 * Website → Pages. It describes how cancellations and refunds actually work (bookings.services, trips.event_booking,
 * payments.services): keep it in step with them.
 */
export const REFUND_POLICY_UPDATED = "17 November 2026";

export function RefundPolicyContent() {
  return (
    <div className="bk-card bk-prose bk-rich">
      <p><em>Last updated: {REFUND_POLICY_UPDATED}</em></p>
      <p>
        This policy explains how you can cancel a GoHyderabad booking and what you get back. It forms part of our{" "}
        <Link href="/terms">terms and conditions</Link>. GoHyderabad is a brand of Go Adventure India Pvt. Ltd.
      </p>

      <h2>1. Each trip and event has its own refund tiers</h2>
      <p>
        The trip or event page shows its refund tiers before you book. A tier says how much is refunded if you cancel at
        least a certain time before the start, for example &ldquo;7 or more days before: 100%&rdquo; or &ldquo;24 or more hours before:
        50%&rdquo;. The tiers that applied when you booked stay with your booking, even if they change later.
      </p>
      <ul>
        <li>The refund is that percentage of <strong>what you have paid</strong> (the advance, or the advance and balance), not of the full price.</li>
        <li>If you cancel later than the last tier, no refund is due.</li>
        <li>Your account shows, before you confirm, exactly how much you would get back if you cancelled now.</li>
      </ul>

      <h2>2. How to cancel</h2>
      <ul>
        <li><strong>Trips:</strong> open <Link href="/account">My bookings</Link>, choose the booking and select &ldquo;Cancel this booking&rdquo;. You can cancel online until the trip starts.</li>
        <li><strong>Events:</strong> cancel the same way, until the online cancellation cut-off shown on the booking (for example a few hours before the start).</li>
        <li>After the online cut-off, message us on WhatsApp. Staff can still help, but the refund follows the tiers above.</li>
        <li>Cancelling releases your places straight away so others can book them.</li>
      </ul>

      <h2>3. Unpaid bookings</h2>
      <p>
        When you book, your places are held for a short time while you pay. If you don&apos;t pay, the hold simply ends and
        nothing is charged. If the balance on a trip isn&apos;t paid by its due date, we may cancel the booking, and the refund
        tiers apply as if you had cancelled on that date.
      </p>

      <h2>4. If we cancel or change a trip or event</h2>
      <ul>
        <li>If we cancel a date (for example for weather, safety, permits or too few participants), you get back <strong>everything you paid</strong>, or you can move to another date where we offer one.</li>
        <li>If we have to make a major change and you no longer want to take part, contact us and we will refund you as if we had cancelled.</li>
      </ul>

      <h2>5. Payments taken in error</h2>
      <ul>
        <li>If you pay twice for the same amount, the extra payment is refunded in full.</li>
        <li>If a payment arrives after your booking&apos;s hold has ended, it is refunded in full, because your places may already have gone to someone else.</li>
      </ul>

      <h2>6. When you are not refunded</h2>
      <ul>
        <li>Not turning up, arriving after the group has left, or leaving a trip or event early.</li>
        <li>Being asked to leave for unsafe behaviour or for breaking the <Link href="/terms">terms</Link> or the trip rules.</li>
        <li>Cancelling later than the last refund tier.</li>
      </ul>

      <h2>7. How refunds are paid</h2>
      <ul>
        <li>Our team checks each refund and sends it, usually within two working days of the cancellation.</li>
        <li>Online payments are refunded through Cashfree to the same card, UPI account or bank account you paid from. Banks usually take 5–7 working days to show the money after it is sent.</li>
        <li>Payments made in cash or by direct bank transfer are refunded by bank transfer or UPI.</li>
        <li>Your account shows each refund&apos;s status. You also get a message on WhatsApp when it is sent.</li>
        <li>Discount codes are not refunded as cash: the refund is based on what you actually paid.</li>
      </ul>

      <h2>8. Changing a booking</h2>
      <p>
        To move to another date or change the number of people, message us before the start. We will help where places
        are available. Any difference in price is charged or refunded under this policy.
      </p>

      <h2>9. Questions</h2>
      <p>
        If something about a refund doesn&apos;t look right, <Link href="/contact">send us a message</Link> with your booking reference and
        we will look into it.
      </p>
    </div>
  );
}
