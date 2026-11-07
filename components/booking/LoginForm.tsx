"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { customerApi } from "@/lib/customer/api";
import { safeNext, useCustomer } from "./CustomerProvider";

type Step = "phone" | "code" | "profile";

/** Indian mobile number: keep the last 10 digits ("+91 98765 43210" and "09876543210" both work). */
const tenDigits = (raw: string) => raw.replace(/\D/g, "").slice(-10);

/** Sign in with a code sent on WhatsApp. New customers are then asked for their name. */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const { user, loading, refresh } = useCustomer();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [wait, setWait] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // already signed in with a complete profile: nothing to do here
  useEffect(() => {
    if (!loading && user?.is_profile_complete && step !== "profile") router.replace(next);
  }, [loading, user, step, next, router]);

  // count down before "Send again" is allowed
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try { await action(); } catch (e: any) { setError(e.message || "Something went wrong. Please try again."); } finally { setBusy(false); }
  }

  const sendCode = () => run(async () => {
    const digits = tenDigits(phone);
    if (digits.length !== 10) throw new Error("Enter your 10-digit mobile number.");
    const res = await customerApi.requestOtp(digits);
    setWait(res.resend_in_seconds ?? 45);
    setStep("code");
  });

  const verify = () => run(async () => {
    const res = await customerApi.verifyOtp(tenDigits(phone), code.trim());
    await refresh();
    if (res.is_profile_complete) router.replace(next); else setStep("profile");
  });

  const saveProfile = () => run(async () => {
    if (!name.trim()) throw new Error("Please enter your name.");
    await customerApi.saveProfile({ full_name: name.trim(), ...(email.trim() ? { email: email.trim() } : {}) });
    await refresh();
    router.replace(next);
  });

  return (
    <div className="bk-narrow">
      <div className="eyebrow">Welcome</div>
      <h1 className="bk-title">Sign <em>in.</em></h1>
      <p className="bk-lede">{step === "profile" ? "One last thing: what should we call you?" : "We'll send a 6-digit code to your WhatsApp. No password needed."}</p>

      <form className="bk-card" style={{ marginTop: 28 }} onSubmit={(e) => { e.preventDefault(); void (step === "phone" ? sendCode() : step === "code" ? verify() : saveProfile()); }}>
        {step !== "profile" && (
          <div className="bk-field">
            <label htmlFor="phone">WhatsApp number</label>
            <input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={step === "code"} required />
            <span className="bk-hint">+91 India</span>
          </div>
        )}
        {step === "code" && (
          <div className="bk-field">
            <label htmlFor="code">6-digit code</label>
            <input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus required />
            <span className="bk-hint">Sent to WhatsApp on +91 {tenDigits(phone)}.</span>
          </div>
        )}
        {step === "profile" && (
          <>
            <div className="bk-field"><label htmlFor="name">Full name</label><input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} autoFocus required /></div>
            <div className="bk-field"><label htmlFor="email">Email (optional)</label><input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          </>
        )}

        {error && <p className="bk-error" role="alert">{error}</p>}
        <button className="btn" type="submit" disabled={busy} style={{ marginTop: 14 }}>
          {busy ? "Please wait…" : step === "phone" ? "Send code on WhatsApp" : step === "code" ? "Verify and continue" : "Save and continue"}
        </button>

        {step === "code" && (
          <div className="bk-btn-row" style={{ marginTop: 14 }}>
            <button type="button" className="bk-linkbtn" disabled={wait > 0 || busy} onClick={() => void sendCode()}>{wait > 0 ? `Send again in ${wait}s` : "Send the code again"}</button>
            <button type="button" className="bk-linkbtn" onClick={() => { setStep("phone"); setCode(""); setError(""); }}>Use a different number</button>
          </div>
        )}
      </form>
    </div>
  );
}
