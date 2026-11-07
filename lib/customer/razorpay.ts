"use client";
import type { PaymentOrder } from "./types";

const SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

declare global {
  interface Window { Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: (r: any) => void) => void } }
}

function loadScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
    const script = existing ?? Object.assign(document.createElement("script"), { src: SCRIPT, async: true });
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("Couldn't load the payment window. Check your connection and try again.")));
    if (!existing) document.body.appendChild(script);
  });
}

export type PaidResult = { razorpay_payment_id: string; razorpay_signature: string };

/** Opens Razorpay's payment window. Resolves when the customer has paid, rejects if they close it or the payment fails. */
export async function payWithRazorpay(order: PaymentOrder, prefill: { name?: string; contact?: string; email?: string }, description: string): Promise<PaidResult> {
  await loadScript();
  if (!window.Razorpay) throw new Error("The payment window is not available.");
  return new Promise<PaidResult>((resolve, reject) => {
    const checkout = new window.Razorpay!({
      key: order.key_id,
      order_id: order.order_id,
      amount: Math.round(Number(order.amount) * 100),   // Razorpay works in paise
      currency: order.currency,
      name: "GoHyderabad",
      description,
      prefill,
      theme: { color: "#e9b44c" },
      handler: (response: PaidResult) => resolve(response),
      modal: { ondismiss: () => reject(new Error("Payment was cancelled. You can try again whenever you're ready.")) },
    });
    checkout.on("payment.failed", (r: any) => reject(new Error(r?.error?.description || "The payment didn't go through.")));
    checkout.open();
  });
}
