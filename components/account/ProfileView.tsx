"use client";
import { useState } from "react";
import { useCustomer } from "@/components/booking/CustomerProvider";
import { customerApi } from "@/lib/customer/api";

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
    </>
  );
}
