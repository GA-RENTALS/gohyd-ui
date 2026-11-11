import type { Metadata } from "next";
import { CartView } from "@/components/booking/CartView";
import { RequireCustomer } from "@/components/booking/CustomerProvider";

export const metadata: Metadata = { title: "Your cart", robots: { index: false, follow: false } };

export default function CartPage() {
  return <RequireCustomer><CartView /></RequireCustomer>;
}
