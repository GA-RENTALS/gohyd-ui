"use client";
import { useT } from "@/components/site/LangProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { customerApi } from "@/lib/customer/api";
import { longDate, money, time } from "@/lib/customer/format";
import type { CartItem, CouponPreview } from "@/lib/customer/types";

/** Several trips in one checkout. Capacity and the coupon are checked again on the server when the checkout is created. */
export function CartView() {
  const t = useT();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<CouponPreview | null>(null);
  const [couponError, setCouponError] = useState("");

  const load = useCallback(async () => {
    try { setItems(await customerApi.cart()); } catch (e) { setError((e as Error).message); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const bookable = useMemo(() => (items ?? []).filter((i) => i.is_bookable), [items]);
  const lines = useMemo(() => bookable.map((i) => ({ schedule: i.schedule, participant_count: i.participant_count, pickup_point: i.pickup_point })), [bookable]);
  const listTotal = bookable.reduce((sum, i) => sum + Number(i.price_per_participant) * i.participant_count, 0);

  async function remove(id: string) {
    setError(""); setPreview(null);
    try { await customerApi.removeFromCart(id); await load(); } catch (e) { setError((e as Error).message); }
  }

  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    setCouponError(""); setPreview(null);
    if (!code.trim() || !lines.length) return;
    try { setPreview(await customerApi.previewCoupon(code.trim(), lines)); }
    catch (err) { setCouponError((err as Error).message); }
  }

  async function checkout() {
    setError(""); setBusy(true);
    try {
      const order = await customerApi.createCheckoutFor(lines, preview?.code ?? "");
      router.push(`/checkout/${order.id}`);
    } catch (e) {
      const err = e as ApiError;
      const failed = (err.body as any)?.details?.items as { schedule: string; reason: string; seats_left?: number }[] | undefined;
      setError(failed?.length
        ? `Some trips can't be booked any more (${failed.map((f) => f.reason === "insufficient_seats" ? `only ${f.seats_left ?? 0} seats left` : f.reason.replace(/_/g, " ")).join(", ")}). Nothing was booked. Update your cart and try again.`
        : err.message);
      setBusy(false);
      void load();
    }
  }

  return (
    <div className="wrap">
      <div className="eyebrow">{t("Cart")}</div>
      <h1 className="bk-title">{t("Your trips")}</h1>
      <p className="bk-lede">{t("Book several trips together and pay the advance for all of them in one go.")}</p>

      {error && <p className="bk-error" role="alert">{error}</p>}
      {items === null && !error && <p className="bk-note" role="status">{t("Loading your cart…")}</p>}
      {items && items.length === 0 && (
        <div className="bk-empty"><p>{t("Your cart is empty.")}</p><Link className="btn" href="/trips">{t("Browse trips")}</Link></div>
      )}

      {items && items.length > 0 && (
        <div className="bk-detail">
          <div className="bk-detail-content">
            {items.map((i) => (
              <section key={i.id} className="bk-card" aria-label={i.trip_title}>
                <h2><Link href={`/trips/${i.trip}`}>{i.trip_title}</Link></h2>
                <p className="bk-note" style={{ margin: "0 0 6px" }}>{longDate(i.starts_at)} · {time(i.starts_at)}{i.pickup_point_name ? ` · Pickup: ${i.pickup_point_name}` : ""}</p>
                <div className="bk-total" style={{ margin: "10px 0 6px" }}>
                  <span>{i.participant_count} × {money(i.price_per_participant)}</span>
                  <strong>{money(Number(i.price_per_participant) * i.participant_count)}</strong>
                </div>
                {!i.is_bookable && <p className="bk-error" role="alert">This date can't be booked any more ({i.seats_left} seats left). Remove it or pick another date on the trip page.</p>}
                <button type="button" className="bk-linkbtn-danger" onClick={() => remove(i.id)}>{t("Remove")}</button>
              </section>
            ))}
          </div>

          <div className="bk-card bk-sticky" id="book">
            <h2>{t("Summary")}</h2>
            <form onSubmit={applyCoupon}>
              <div className="bk-field">
                <label htmlFor="coupon">{t("Coupon code")}</label>
                <div className="bk-row2 is-keep">
                  <input id="coupon" value={code} maxLength={30} autoCapitalize="characters" onChange={(e) => { setCode(e.target.value.toUpperCase()); setPreview(null); setCouponError(""); }} placeholder="e.g. MONSOON10" />
                  <button type="submit" className="btn btn-ghost" disabled={!code.trim() || !lines.length}>{t("Apply")}</button>
                </div>
              </div>
            </form>
            {couponError && <p className="bk-error" role="alert">{couponError}</p>}
            {preview && <p className="bk-ok" role="status">{preview.code} applied: you save {money(preview.discount)}.</p>}

            <div className="bk-total"><span>{t("Trips")}</span><span>{bookable.length}</span></div>
            {preview && <div className="bk-total" style={{ borderTop: 0, margin: 0 }}><span>{t("Discount")}</span><span>− {money(preview.discount)}</span></div>}
            <div className="bk-total"><span>{t("Total")}</span><strong>{money(preview ? preview.total_after : listTotal)}</strong></div>
            <p className="bk-hint" style={{ margin: "-6px 0 16px" }}>You'll pay the advance for each trip at checkout. Taxes, if any, are shown there.</p>
            <button type="button" className="btn" disabled={busy || !lines.length} onClick={checkout}>
              {busy ? t("Please wait…") : `Check out ${lines.length} trip${lines.length === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
