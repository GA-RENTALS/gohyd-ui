"use client";
/**
 * Coupon code box for an event booking. The server works out the discount (and checks it again when booking), so this
 * only shows what it said. The discount is re-checked whenever the number of people changes.
 */
import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/site/LangProvider";
import { customerApi } from "@/lib/customer/api";
import { money } from "@/lib/customer/format";
import type { CouponPreview } from "@/lib/customer/types";

export function EventCouponBox({ event, participants, phone, applied, onChange }: {
  event: string; participants: number; phone: string; applied: CouponPreview | null; onChange: (preview: CouponPreview | null) => void;
}) {
  const t = useT();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lastCount = useRef(participants);

  async function check(value: string) {
    setBusy(true);
    setError("");
    try {
      onChange(await customerApi.previewEventCoupon({ event, participant_count: participants, code: value, phone: phone.trim() || undefined }));
    } catch (e) {
      onChange(null);
      setError(e instanceof Error ? e.message : t("This coupon code is not valid."));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (applied && lastCount.current !== participants) check(applied.code);
    lastCount.current = participants;
    // only the participant count should trigger a re-check; `check` reads the latest values when it runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants]);

  if (applied) {
    return (
      <div className="bk-field">
        <p className="bk-ok" role="status">{applied.code} {t("applied")}: −{money(applied.discount)}</p>
        <button type="button" className="bk-linkbtn" onClick={() => { onChange(null); setCode(""); }}>{t("Remove coupon")}</button>
      </div>
    );
  }
  return (
    <div className="bk-field">
      <label htmlFor="event-coupon">{t("Coupon code")} <span className="bk-label-optional">{t("(optional)")}</span></label>
      <div className="bk-row2 is-keep">
        <input id="event-coupon" value={code} maxLength={30} autoComplete="off" autoCapitalize="characters" placeholder="e.g. MONSOON10"
          onChange={(e) => { setCode(e.target.value.toUpperCase().replace(/\s/g, "")); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (code) check(code); } }} />
        <button type="button" className="btn btn-ghost" disabled={!code || busy} onClick={() => check(code)}>{busy ? t("Checking…") : t("Apply")}</button>
      </div>
      {error && <p className="bk-error" role="alert">{error}</p>}
    </div>
  );
}
