"use client";
/** Asks before unsubscribing: a button press, not the link itself, so email scanners that open links can't unsubscribe anyone. */
import Link from "next/link";
import { useState } from "react";
import { customerApi } from "@/lib/customer/api";

export function UnsubscribeForm({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  if (!token) return <p className="bk-error" role="alert">This link is incomplete. Copy the whole unsubscribe link from the email, or <Link href="/contact">contact us</Link>.</p>;
  if (state === "done") return (
    <div className="bk-card bk-prose">
      <p><strong>{email}</strong> is unsubscribed. You won't get the GoHyderabad newsletter any more.</p>
      <p>Changed your mind? Sign up again at the bottom of any page.</p>
    </div>
  );

  async function confirm() {
    setState("busy");
    setError("");
    try {
      setEmail((await customerApi.newsletterUnsubscribe(token)).email);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't unsubscribe you. Please try again.");
      setState("idle");
    }
  }

  return (
    <div className="bk-card bk-prose">
      <p>Stop receiving the GoHyderabad newsletter? Booking messages about trips you've booked are not affected.</p>
      {error && <p className="bk-error" role="alert">{error}</p>}
      <button type="button" className="btn" disabled={state === "busy"} onClick={confirm}>{state === "busy" ? "Please wait…" : "Unsubscribe"}</button>
    </div>
  );
}
