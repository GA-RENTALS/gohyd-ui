import type { Metadata } from "next";
import { BookingsView } from "@/components/account/BookingsView";

export const metadata: Metadata = { title: "My bookings", robots: { index: false, follow: false } };

export default function AccountPage() {
  return <BookingsView />;
}
