import type { Metadata } from "next";
import { InvoiceView } from "@/components/account/InvoiceView";

export const metadata: Metadata = { title: "Invoice", robots: { index: false, follow: false } };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InvoiceView bookingId={id} />;
}
