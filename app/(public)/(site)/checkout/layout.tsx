import type { Metadata } from "next";
import type { ReactNode } from "react";

/** Checkout pages are private to the signed-in customer: never index them. */
export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return children;
}
