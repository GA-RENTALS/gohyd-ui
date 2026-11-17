"use client";
import { useEffect, useState } from "react";
import { useCustomer } from "@/components/booking/CustomerProvider";
import { customerApi } from "@/lib/customer/api";
import type { DeletionRequest, MessagePreferences } from "@/lib/customer/types";

export function ProfileView() {
  const { user, refresh } = useCustomer();
  const [name, setName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  if (!user) return null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      await customerApi.saveProfile({ full_name: name.trim(), email: email.trim() || (null as unknown as string) });
      await refresh();
      setMsg({ ok: true, text: "Your details are saved." });
    } catch (err: any) { setMsg({ ok: false, text: err.message }); } finally { setBusy(false); }
  }

  return (
    <>
      <section className="ac-hero is-short">
        <div>
          <p className="ac-eyebrow">Your account · GoHyderabad</p>
          <h1>My details</h1>
          <p>We use these to contact you about your trips.</p>
        </div>
      </section>
      <form className="ac-form" onSubmit={save}>
        <div className="ac-row2">
          <div className="ac-field"><label htmlFor="pname">Full name</label><input id="pname" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className="ac-field"><label htmlFor="pphone">WhatsApp number</label><input id="pphone" value={user.phone_number} disabled /><span className="ac-caption">This is the number you sign in with.</span></div>
        </div>
        <div className="ac-field"><label htmlFor="pemail">Email</label><input id="pemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        {msg && <p className={msg.ok ? "ac-ok" : "ac-error"} role="status">{msg.text}</p>}
        <div className="ac-actions"><button className="ac-btn is-primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save details"}</button></div>
      </form>
      <MessagePreferencesForm key={JSON.stringify(user.customer_profile)} saved={user.customer_profile} onSaved={refresh} />
      <PrivacyPanel />
    </>
  );
}

/** Booking messages and reminders by WhatsApp or email, and offers. Login codes always arrive on WhatsApp. */
function MessagePreferencesForm({ saved, onSaved }: { saved: MessagePreferences | null; onSaved: () => Promise<unknown> }) {
  const initial: MessagePreferences = {
    notify_whatsapp: saved?.notify_whatsapp ?? true, notify_email: saved?.notify_email ?? true, marketing_opt_in: saved?.marketing_opt_in ?? false,
  };
  const [prefs, setPrefs] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const changed = (Object.keys(initial) as (keyof MessagePreferences)[]).some((k) => prefs[k] !== initial[k]);
  const toggle = (k: keyof MessagePreferences) => (e: React.ChangeEvent<HTMLInputElement>) => setPrefs((p) => ({ ...p, [k]: e.target.checked }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      await customerApi.saveProfile({ customer_profile: prefs });
      await onSaved();
      setMsg({ ok: true, text: "Your message choices are saved." });
    } catch (err: any) { setMsg({ ok: false, text: err.message }); } finally { setBusy(false); }
  }

  return (
    <form className="ac-form ac-panel" onSubmit={save}>
      <h2>Messages</h2>
      <p className="ac-caption">Booking confirmations, payment receipts and trip reminders. Sign-in codes always come on WhatsApp.</p>
      <label className="ac-check"><input type="checkbox" checked={prefs.notify_whatsapp} onChange={toggle("notify_whatsapp")} /> Send me booking messages on WhatsApp</label>
      <label className="ac-check"><input type="checkbox" checked={prefs.notify_email} onChange={toggle("notify_email")} /> Send me booking messages by email</label>
      <label className="ac-check"><input type="checkbox" checked={prefs.marketing_opt_in} onChange={toggle("marketing_opt_in")} /> Tell me about new trips and offers</label>
      {!prefs.notify_whatsapp && !prefs.notify_email && <p className="ac-caption">With both off you won't get booking updates or reminders. Check your bookings here instead.</p>}
      {msg && <p className={msg.ok ? "ac-ok" : "ac-error"} role="status">{msg.text}</p>}
      <div className="ac-actions"><button className="ac-btn is-primary" type="submit" disabled={busy || !changed}>{busy ? "Saving…" : "Save message choices"}</button></div>
    </form>
  );
}

/** Download everything we hold, or ask for the account to be deleted (staff process it; tax records are kept as the law requires). */
function PrivacyPanel() {
  const [requests, setRequests] = useState<DeletionRequest[] | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState("");
  useEffect(() => { customerApi.deletionRequests().then((d) => setRequests(d.results)).catch(() => setRequests([])); }, []);
  const open = requests?.find((r) => r.status === "REQUESTED" || r.status === "IN_PROGRESS");

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key); setMsg(null);
    try { await fn(); } catch (err: any) { setMsg({ ok: false, text: err.message }); } finally { setBusy(""); }
  }

  return (
    <section className="ac-form ac-panel">
      <h2>Your data</h2>
      <p className="ac-caption">Download a copy of your details, bookings and payments, or ask us to delete your account. <a href="/privacy">Privacy policy</a></p>
      <div className="ac-actions">
        <button type="button" className="ac-btn" disabled={busy === "download"} onClick={() => run("download", customerApi.downloadMyData)}>
          {busy === "download" ? "Preparing…" : "Download my data"}
        </button>
        {!open && !confirming && <button type="button" className="ac-btn" onClick={() => setConfirming(true)}>Delete my account…</button>}
      </div>
      {open && <p className="ac-note">You asked us to delete your account on {new Date(open.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}. The team will confirm by WhatsApp when it is done.</p>}
      {confirming && !open && (
        <div className="ac-note">
          <p>We'll remove your account and personal details. Invoices and payment records are kept for as long as tax law requires. Upcoming bookings should be cancelled first.</p>
          <div className="ac-field"><label htmlFor="del-reason">Reason (optional)</label><input id="del-reason" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          <div className="ac-actions">
            <button type="button" className="ac-btn is-danger" disabled={busy === "delete"} onClick={() => run("delete", async () => {
              setRequests((await customerApi.requestDeletion(reason.trim())).results);
              setConfirming(false);
              setMsg({ ok: true, text: "Request received. The team will confirm by WhatsApp." });
            })}>{busy === "delete" ? "Sending…" : "Ask to delete my account"}</button>
            <button type="button" className="ac-btn" onClick={() => setConfirming(false)}>Keep my account</button>
          </div>
        </div>
      )}
      {msg && <p className={msg.ok ? "ac-ok" : "ac-error"} role="status">{msg.text}</p>}
    </section>
  );
}
