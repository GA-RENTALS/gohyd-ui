"use client";
import { use } from "react";
import { CheckoutView } from "@/components/booking/CheckoutView";
import { RequireCustomer } from "@/components/booking/CustomerProvider";

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="wrap">
      <RequireCustomer>
        <CheckoutView id={id} />
      </RequireCustomer>
    </div>
  );
}
