import Link from "next/link";

/**
 * General terms and conditions, shown at /terms until a "terms" page is published under Admin → Website → Pages
 * (a published page replaces this text). Keep it in step with how booking and payment actually work.
 */
export const TERMS_UPDATED = "17 November 2026";

export function TermsContent() {
  return (
    <div className="bk-card bk-prose bk-rich">
      <p><em>Last updated: {TERMS_UPDATED}</em></p>
      <p>
        These terms apply when you use the GoHyderabad website or book a trip, event or experience with us. GoHyderabad is a
        brand of Go Adventure India Pvt. Ltd. (&ldquo;GoHyderabad&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account or making a booking,
        you agree to these terms, to the <Link href="/refund-policy">cancellation and refund policy</Link> and to our{" "}
        <Link href="/privacy">privacy policy</Link>.
      </p>

      <h2>1. Your account</h2>
      <ul>
        <li>You sign in with a one-time code sent to your WhatsApp number. Keep your phone secure: anyone with it can use your account.</li>
        <li>Give your real name and correct details for yourself and everyone you book for. We use them for the booking, safety and any permits.</li>
        <li>You must be 18 or older to make a booking. Minors may join only where the trip or event allows it and with a parent or guardian on the booking.</li>
      </ul>

      <h2>2. Bookings</h2>
      <ul>
        <li>Places are held for a short time while you pay. A booking is confirmed only when we have received the required payment (the advance, or the full price where no advance applies). We confirm it on the website and on WhatsApp.</li>
        <li>Each trip or event page shows what is included, the dates, the meeting or pickup points and any requirements. Please read it before you book.</li>
        <li>We may decline or cancel a booking made with incorrect details, in breach of these terms, or because of an obvious pricing error. Any money you paid for it is refunded in full.</li>
      </ul>

      <h2>3. Prices and payment</h2>
      <ul>
        <li>Prices are in Indian rupees (INR). Taxes are charged as shown at checkout, and a GST invoice is available from your account where applicable.</li>
        <li>Online payments are processed securely by Cashfree Payments. We never see or store your card, UPI PIN or bank login details.</li>
        <li>Where a trip or event takes an advance, the balance is due by the date shown on your booking. If the balance is not paid in time, we may cancel the booking under the cancellation and refund policy.</li>
        <li>Discount codes are subject to the conditions shown with them, cannot be exchanged for cash and may be withdrawn at any time.</li>
      </ul>

      <h2>4. Cancellations and refunds</h2>
      <ul>
        <li><strong>If you cancel:</strong> you can cancel from your account until the cut-off shown on the booking. The refund follows the policy shown on the trip or event page when you booked.</li>
        <li><strong>If we cancel</strong> (for example for weather, safety, permits or too few participants): you get back everything you paid, or you can move to another date where we offer one.</li>
        <li>Refunds go back to the account or card you paid from. Banks usually take 5–7 working days to show the money once we have sent it.</li>
        <li>Full details are in the <Link href="/refund-policy">cancellation and refund policy</Link>.</li>
      </ul>

      <h2>5. Safety and conduct</h2>
      <ul>
        <li>Outdoor and adventure activities carry risk. Before a trip you are asked to accept a participation waiver for everyone on the booking. Tell us about any medical condition that may affect you.</li>
        <li>Follow the instructions of the trip leader, guides and venue staff, and any rules for the place you visit.</li>
        <li>Alcohol, drugs, harassment, discrimination or unsafe behaviour are not allowed. We may ask anyone who puts themselves or others at risk to leave the trip or event, without a refund.</li>
        <li>Carry a valid photo ID, and any equipment or clothing listed on the trip or event page.</li>
      </ul>

      <h2>6. Changes to plans</h2>
      <p>
        Weather, road conditions, local authorities or venues can force a change of route, timing, activity or venue. We will
        tell you as early as we can and offer a reasonable alternative. If a change is major and you no longer want to take
        part, contact us and we will refund you as if we had cancelled.
      </p>

      <h2>7. Photos and reviews</h2>
      <p>
        We may photograph or film trips and events and use the pictures on our website and social media. Tell the trip leader
        if you would rather not appear. Reviews and comments you share must be honest and must not contain anything unlawful
        or offensive.
      </p>

      <h2>8. Other providers</h2>
      <p>
        Some services, such as transport, venues and activity operators, are provided by partners. We choose them with care
        and remain your point of contact for the booking, but their own terms may also apply while you use their services.
      </p>

      <h2>9. Our responsibility</h2>
      <ul>
        <li>We take reasonable care in planning and running every trip and event.</li>
        <li>To the extent the law allows, we are not responsible for loss or damage caused by your own actions, by events outside our reasonable control, or for indirect losses such as missed connections or lost earnings.</li>
        <li>Except where the law does not allow it, our total responsibility for a booking is limited to the amount you paid for it. Nothing in these terms limits responsibility for death or personal injury caused by our negligence.</li>
        <li>Look after your belongings: we cannot be responsible for personal items that are lost or damaged.</li>
      </ul>

      <h2>10. Your information</h2>
      <p>
        We use your information to run your bookings and to keep you informed, as explained in the <Link href="/privacy">privacy policy</Link>.
        You can download your data, change which messages you get, or ask us to delete your account from your account page.
      </p>

      <h2>11. Changes to these terms</h2>
      <p>
        We may update these terms from time to time. The version shown here when you book applies to that booking.
      </p>

      <h2>12. Law and disputes</h2>
      <p>
        These terms are governed by the laws of India. If something goes wrong, please contact us first so we can try to put it
        right. Any dispute that cannot be resolved will be handled by the courts in Hyderabad, Telangana.
      </p>

      <h2>13. Contact us</h2>
      <p>
        Questions about these terms or a booking? <Link href="/contact">Send us a message</Link> and the GoHyderabad team will get back to you.
      </p>
    </div>
  );
}
