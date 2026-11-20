"use client";
/**
 * Cashfree hosted checkout. The server creates the order (POST /payments/cashfree/create-order/) and returns its
 * payment_session_id; this opens Cashfree's page for it. Cashfree then sends the customer to the thank-you page with
 * ?order_id=…, which asks the server what happened. The browser is never trusted with the result: the server checks
 * with Cashfree before recording anything.
 */
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

/** Where Cashfree brings the customer back to (set by the server when it creates the order). */
export const THANK_YOU_PATH = "/booking/thank-you";

/**
 * Orders opened before payments returned to the thank-you page came back to the checkout or account page with
 * ?order_id=…: send those on to the thank-you page, which checks the payment. Returns true when it redirected.
 */
export function forwardCashfreeReturn(): boolean {
  const orderId = new URLSearchParams(window.location.search).get("order_id");
  if (!orderId) return false;
  window.location.replace(`${THANK_YOU_PATH}?order_id=${encodeURIComponent(orderId)}`);
  return true;
}

/** What to tell the customer for each outcome. */
export const OUTCOME_TEXT: Record<PaymentOutcome["status"], string> = {
  paid: "Payment received. Thank you!",
  pending: "Your payment is being confirmed. This page updates as soon as Cashfree confirms it; no need to pay again.",
  failed: "The payment didn't go through, and no money was taken. You can try again.",
  cancelled: "The payment was cancelled. You can pay whenever you're ready.",
  expired: "The payment window closed. Start the payment again to continue.",
};
