"use client";
import { RiPhoneLine } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { SegmentedControl, SegmentedControlItem } from "@/components/base/segmented-control/segmented-control";
import { adminApi, tokenStore } from "@/lib/admin/api";

type Mode = "password" | "otp";

export default function AdminLogin() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function switchMode(next: Mode) {
    setMode(next);
    setErr("");
    setSent(false);
    setOtp("");
    setPassword("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      if (mode === "password") {
        await adminApi.passwordLogin(phone.trim(), password);
      } else if (!sent) {
        await adminApi.requestOtp(phone.trim());
        setSent(true);
        return;
      } else {
        await adminApi.verifyOtp(phone.trim(), otp.trim());
      }
      await adminApi.session(); // server-confirmed staff access
      router.replace("/admin");
    } catch (e: any) {
      if (mode === "otp" ? sent : true) tokenStore.clear();
      setErr(e.status === 403 ? "This account doesn't have staff access." : e.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const cta = mode === "password" ? "Sign in" : sent ? "Verify & sign in" : "Send code";

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <form onSubmit={submit} className="flex w-full max-w-[380px] flex-col gap-4 rounded-2xl border border-border-button-default bg-background-primary-default p-7 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/brand/gohyderabad-logo.png" alt="GoHyderabad: Meet. Explore. Experience." className="h-28 w-auto" />
          <h1 className="text-title-3-semibold text-text-primary">Welcome back</h1>
          <p className="text-body-regular text-text-secondary">Sign in to the GoHyderabad workspace</p>
        </div>

        <SegmentedControl
          aria-label="Sign-in method"
          selectedKeys={new Set([mode])}
          onSelectionChange={(keys) => {
            const next = [...keys][0];
            if (next && next !== mode) switchMode(next as Mode);
          }}
          className="self-center"
        >
          <SegmentedControlItem id="password">Password</SegmentedControlItem>
          <SegmentedControlItem id="otp">OTP</SegmentedControlItem>
        </SegmentedControl>

        <Input label="Phone number" placeholder="98765 43210" leadingIcon={RiPhoneLine} type="tel" value={phone} onChange={setPhone} isDisabled={mode === "otp" && sent} isRequired autoComplete="tel" />
        {mode === "password" && (
          <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={setPassword} isRequired autoComplete="current-password" />
        )}
        {mode === "otp" && sent && (
          <Input label="6-digit code" hint="Sent via WhatsApp" placeholder="••••••" value={otp} onChange={setOtp} isRequired inputMode="numeric" maxLength={6} autoComplete="one-time-code" />
        )}

        {err && <p role="alert" className="text-body-regular text-text-error-primary">{err}</p>}
        <Button type="submit" variant="primary" disabled={busy} className="w-full">{busy ? "Please wait…" : cta}</Button>
        {mode === "otp" && sent && (
          <button type="button" className="text-body-regular text-text-secondary hover:text-text-primary" onClick={() => { setSent(false); setOtp(""); setErr(""); }}>
            Use a different number
          </button>
        )}
      </form>
    </main>
  );
}
