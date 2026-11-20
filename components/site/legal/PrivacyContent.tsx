import Link from "next/link";

/**
 * Privacy policy, shown at /privacy until a "privacy" page is published under Admin → Website → Pages. It describes
 * what the site really collects and where it goes; keep it in step with the code (accounts, bookings, payments,
 * notifications, lib/analytics.ts, accounts/privacy.py).
 */
export const PRIVACY_UPDATED = "17 November 2026";

export function PrivacyContent() {
  return (
    <div className="bk-card bk-prose bk-rich">
      <p><em>Last updated: {PRIVACY_UPDATED}</em></p>
      <p>
        This policy explains what personal data GoHyderabad collects, why, who it is shared with and the choices you have.
        GoHyderabad is a brand of Go Adventure India Pvt. Ltd., which is responsible for your data (the &ldquo;data
        fiduciary&rdquo; under India&apos;s Digital Personal Data Protection Act, 2023).
      </p>

      <h2>1. What we collect</h2>
      <ul>
        <li><strong>Your account:</strong> your mobile number (you sign in with a code sent to WhatsApp), name, email if you add it, preferred language and message choices.</li>
        <li><strong>Bookings:</strong> the trips and events you book, dates, pickup points, notes you send us, and for each participant their name, and where the trip needs it, age, gender, phone and an emergency contact. We also record each participant&apos;s acceptance of the safety waiver.</li>
        <li><strong>Payments:</strong> amounts, dates and the reference numbers Cashfree gives us. Card numbers, UPI PINs and bank logins go only to Cashfree; we never see or store them. Older event bookings paid by UPI may include the payment screenshot you sent.</li>
        <li><strong>Billing:</strong> a billing name, GSTIN and address if you give them for a GST invoice.</li>
        <li><strong>Messages and enquiries:</strong> what you send through our contact, corporate or event forms, and your newsletter sign-up.</li>
        <li><strong>Using the website:</strong> pages visited and the kind of device and browser, through Google Analytics, which runs for every visitor. With your permission (the &ldquo;Privacy choices&rdquo; banner) we also record page views on our own system. You can decline and still use the site.</li>
        <li><strong>Security:</strong> sign-in times and the network address used, to protect accounts and payments.</li>
      </ul>

      <h2>2. Why we use it</h2>
      <ul>
        <li>To make and manage your bookings, take payments, issue invoices and handle cancellations and refunds.</li>
        <li>To send you booking confirmations, receipts, reminders and changes on WhatsApp, and by email if you choose.</li>
        <li>To keep participants safe on trips, and to meet legal duties such as tax and accounting records.</li>
        <li>To answer your enquiries and support requests.</li>
        <li>To send news about trips and offers, only if you agreed to it. You can stop at any time.</li>
        <li>To understand how the site is used and to improve it, and to prevent fraud and misuse.</li>
      </ul>

      <h2>3. Who we share it with</h2>
      <p>We do not sell your personal data. We share it only as needed with:</p>
      <ul>
        <li><strong>Cashfree Payments</strong>, which processes online payments and refunds.</li>
        <li><strong>WhatsApp (Meta)</strong>, which delivers sign-in codes and booking messages.</li>
        <li><strong>Amazon Web Services</strong>, which hosts our systems and files in India.</li>
        <li><strong>Google</strong>, for website analytics.</li>
        <li><strong>Trip and event partners</strong>, such as transport operators, venues and guides, who receive the names and phone numbers they need to run your trip.</li>
        <li><strong>Authorities</strong>, when the law requires it or to protect someone&apos;s safety.</li>
      </ul>

      <h2>4. How long we keep it</h2>
      <ul>
        <li>Your account stays until you ask us to delete it.</li>
        <li>Bookings, payments and invoices are kept for as long as tax and accounting law requires (currently up to eight years), even if you delete your account.</li>
        <li>Enquiries and newsletter sign-ups are kept until they are no longer needed, or until you unsubscribe or ask us to delete them.</li>
      </ul>

      <h2>5. Your choices and rights</h2>
      <ul>
        <li><strong>See and download your data:</strong> use &ldquo;Download my data&rdquo; on your <Link href="/account/profile">account page</Link>.</li>
        <li><strong>Correct it:</strong> edit your details on the account page, or ask us.</li>
        <li><strong>Delete your account:</strong> use &ldquo;Delete my account&rdquo; on the account page. We remove your personal details and confirm on WhatsApp, keeping only what the law requires.</li>
        <li><strong>Messages:</strong> choose WhatsApp, email and offers on the account page. Each newsletter has an unsubscribe link.</li>
        <li><strong>Analytics:</strong> change your choice with &ldquo;Privacy choices&rdquo; at the bottom of any page.</li>
        <li><strong>Withdraw consent or complain:</strong> <Link href="/contact">contact us</Link>. If you are not satisfied with our answer, you may complain to the Data Protection Board of India.</li>
      </ul>

      <h2>6. Security</h2>
      <p>
        Data travels over encrypted connections, sign-in uses one-time codes, staff see only what their role needs, and staff
        access to personal data is logged. Payment details stay with Cashfree. No system is perfectly secure: if a breach
        affects you, we will tell you and the authorities as the law requires.
      </p>

      <h2>7. Children</h2>
      <p>
        Accounts are for adults. Children can join a trip or event only where it allows them, booked by a parent or guardian,
        who gives us the child&apos;s details on their behalf.
      </p>

      <h2>8. Changes</h2>
      <p>We may update this policy. The date at the top shows when it last changed, and important changes are announced on the website.</p>

      <h2>9. Contact</h2>
      <p>
        For any question or request about your data, <Link href="/contact">send us a message</Link> and the GoHyderabad team will reply.
      </p>
    </div>
  );
}
