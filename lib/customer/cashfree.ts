"use client";
/**
 * Cashfree hosted checkout. The server creates the order (POST /payments/cashfree/create-order/) and returns its
 * payment_session_id; this opens Cashfree's page for it. Cashfree then sends the customer back to the page the server
 * chose with ?order_id=…, where `verifyCashfreeReturn` asks the server what happened. The browser is never trusted with
 * the result: the server checks with Cashfree before recording anything.
 */
import { customerApi } from "./api";
import type { PaymentOutcome, PaymentSession } from "./types";

const SDK = "https://sdk.cashfree.com/js/v3/cashfree.js";

type CashfreeInstance = { checkout: (options: { paymentSessionId: string; redirectTarget?: "_self" | "_blank" | "_top" | "_modal" }) => Promise<unknown> };
declare global {
  interface Window { Cashfree?: (options: { mode: "sandbox" | "production" }) => CashfreeInstance }
}

function loadSdk(): Promise<void> {
  if (window.Cashfree) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SDK}"]`);
    const script = existing ?? Object.assign(document.createElement("script"), { src: SDK, async: true });
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("Couldn't load the payment page. Check your connection and try again.")));
    if (!existing) document.body.appendChild(script);
  });
}

/** Sends the customer to Cashfree to pay this session. Resolves only if the redirect could not start. */
export async function openCashfreeCheckout(session: PaymentSession): Promise<void> {
  await loadSdk();
  if (!window.Cashfree) throw new Error("The payment page is not available right now.");
  await window.Cashfree({ mode: session.mode }).checkout({ paymentSessionId: session.payment_session_id, redirectTarget: "_self" });
}

/** On the page Cashfree returns to: the order in the address, checked with the server, then removed from the address. */
export async function verifyCashfreeReturn(): Promise<PaymentOutcome | null> {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("order_id");
  if (!orderId) return null;
  params.delete("order_id");
  window.history.replaceState(null, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}`);
  try {
    return await customerApi.verifyPayment(orderId);
  } catch {
    return { status: "pending", order_id: orderId, message: "We couldn't check your payment yet. It will show here as soon as Cashfree confirms it." };
  }
}

/** What to tell the customer for each outcome. */
export const OUTCOME_TEXT: Record<PaymentOutcome["status"], string> = {
  paid: "Payment received. Thank you!",
  pending: "Your payment is being confirmed. This page updates as soon as Cashfree confirms it; no need to pay again.",
  failed: "The payment didn't go through, and no money was taken. You can try again.",
  cancelled: "The payment was cancelled. You can pay whenever you're ready.",
  expired: "The payment window closed. Start the payment again to continue.",
};
