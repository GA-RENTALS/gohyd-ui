"use client";

import { type FormEvent, useState } from "react";
import { API_URL } from "@/lib/config";

type Props = { kind: "contact" | "corporate" };

export function PublicEnquiryForm({ kind }: Props) {
  const corporate = kind === "corporate";
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    if (!String(values.get("phone") || "").trim() && !String(values.get("email") || "").trim()) {
      setMessage("Add a phone number or email so we can reply.");
      setSuccess(false);
      return;
    }
    setBusy(true);
    setMessage("");
    setSuccess(false);
    const payload = corporate ? {
      company: String(values.get("company") || "").trim(),
      contact_name: String(values.get("name") || "").trim(),
      phone: String(values.get("phone") || "").trim(),
      email: String(values.get("email") || "").trim(),
      group_size: values.get("group_size") ? Number(values.get("group_size")) : null,
      preferred_dates: String(values.get("preferred_dates") || "").trim(),
      brief: String(values.get("message") || "").trim(),
    } : {
      name: String(values.get("name") || "").trim(),
      phone: String(values.get("phone") || "").trim(),
      email: String(values.get("email") || "").trim(),
      message: String(values.get("message") || "").trim(),
      source: "website-contact",
      consent_to_contact: values.get("consent") === "on",
    };

    try {
      const response = await fetch(`${API_URL}/${corporate ? "corporate-enquiries" : "enquiries"}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { detail?: string } | null;
        throw new Error(body?.detail || "Please check the details and try again.");
      }
      form.reset();
      setSuccess(true);
      setMessage(corporate ? "Thanks. The team will be in touch about your outing." : "Thanks for getting in touch. The team will reply soon.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We couldn't send your message. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="bk-card" onSubmit={submit}>
      <h2>{corporate ? "Tell us about your group" : "Send us a message"}</h2>
      {corporate && <div className="bk-field"><label htmlFor="company">Company / organisation</label><input id="company" name="company" required maxLength={200} autoComplete="organization" /></div>}
      <div className="bk-field"><label htmlFor="name">{corporate ? "Your name" : "Name"}</label><input id="name" name="name" required maxLength={150} autoComplete="name" /></div>
      <div className="bk-row2">
        <div className="bk-field"><label htmlFor="phone">Phone{!corporate && <span className="bk-label-optional"> · optional if email supplied</span>}</label><input id="phone" name="phone" type="tel" autoComplete="tel" /></div>
        <div className="bk-field"><label htmlFor="email">Email{!corporate && <span className="bk-label-optional"> · optional if phone supplied</span>}</label><input id="email" name="email" type="email" autoComplete="email" /></div>
      </div>
      {corporate && <div className="bk-row2"><div className="bk-field"><label htmlFor="group-size">Group size</label><input id="group-size" name="group_size" type="number" min="1" /></div><div className="bk-field"><label htmlFor="preferred-dates">Preferred dates</label><input id="preferred-dates" name="preferred_dates" maxLength={200} placeholder="Dates or month" /></div></div>}
      <div className="bk-field"><label htmlFor="message">{corporate ? "What do you have in mind?" : "Message"}</label><textarea id="message" name="message" rows={5} maxLength={4000} required /></div>
      {!corporate && <label className="bk-check"><input type="checkbox" name="consent" required /><span>You agree that GoHyderabad may contact you about this message.</span></label>}
      {message && <p className={success ? "bk-ok" : "bk-error"} role={success ? "status" : "alert"}>{message}</p>}
      <button className="btn" type="submit" disabled={busy} style={{ marginTop: 16 }}>{busy ? "Sending…" : corporate ? "Request an outing" : "Send message"}</button>
    </form>
  );
}
