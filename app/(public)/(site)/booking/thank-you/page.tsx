import type { Metadata } from "next";
import { RequireCustomer } from "@/components/booking/CustomerProvider";
import { ThankYouView } from "@/components/booking/ThankYouView";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({ title: "Thank you", path: "/booking/thank-you", noindex: true });

/** Where customers land after paying on Cashfree, or after a free booking. */
export default function ThankYouPage() {
  return (
    <RequireCustomer>
      <ThankYouView />
    </RequireCustomer>
  );
}
