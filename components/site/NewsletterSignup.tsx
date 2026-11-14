"use client";
/** Footer newsletter sign-up (POST /newsletter/). The server answers the same way for new and existing addresses. */
import { useState } from "react";
import { useT } from "@/components/site/LangProvider";
import { customerApi } from "@/lib/customer/api";

export function NewsletterSignup() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("busy");
    setError("");
    try {
      await customerApi.newsletterSignup(email.trim());
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Couldn't sign you up. Please try again."));
      setState("idle");
    }
  }

  if (state === "done") return <p className="foot-news-ok" role="status">{t("You're on the list. New trips and events will land in your inbox.")}</p>;
  return (
    <form className="foot-news" onSubmit={submit}>
      <label htmlFor="newsletter-email">{t("New trips and events by email")}</label>
      <div className="foot-news-row">
        <input id="newsletter-email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" disabled={state === "busy"}>{state === "busy" ? t("Sending…") : t("Subscribe")}</button>
      </div>
      <small>{t("By subscribing you agree to receive our emails. Unsubscribe any time.")}</small>
      {error && <p className="foot-news-error" role="alert">{error}</p>}
    </form>
  );
}
