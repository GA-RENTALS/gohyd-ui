"use client";
import { RiArrowRightUpLine, RiCheckLine, RiPhoneLine } from "@remixicon/react";
import { useState } from "react";
import { RecordPaymentModal } from "@/components/admin/Overview";
import { PromptModal } from "@/components/admin/ResourceView";
import { useAdmin } from "@/components/admin/Shell";
import { dateTime, Drawer, Facts, money, relDay, StatusPill } from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/base/buttons/button";
import { toast } from "@/components/base/toast/toast";
import { adminApi, type BookingRow } from "@/lib/admin/api";

/**
 * One trip or event booking in a side panel, with the things staff do to it: confirm, record a payment, cancel,
 * or jump to the trip/event page or the customer.
 */
export function BookingDrawer({ row, onClose, onChanged, can }: {
  row: BookingRow | null; onClose: () => void; onChanged: () => void;
  can: { cancel?: boolean; confirm?: boolean; record_payment?: boolean };
}) {
  const { refreshCounts } = useAdmin();
  const [busy, setBusy] = useState(false);
  const [prompt, setPrompt] = useState<{ title: string; label: string; run: (t: string) => Promise<void> } | null>(null);
  const [paying, setPaying] = useState(false);

  async function act(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try { await fn(); toast(ok, { status: "success" }); onChanged(); refreshCounts(); onClose(); }
    catch (e: any) { toast(e.message || "Something went wrong", { status: "error" }); throw e; }
    finally { setBusy(false); }
  }

  if (!row) return null;
  const isTrip = row.type === "trip";
  const open = row.bucket !== "cancelled";
  return (
    <>
      <Drawer open onClose={onClose} title={row.name} sub={<span className="flex flex-wrap items-center gap-2">{row.reference}<StatusPill status={row.status} label={row.status_label} /></span>}
        footer={<>
          {!isTrip && can.confirm && row.status === "PENDING" && (
            <Button variant="primary" leadingIcon={RiCheckLine} disabled={busy} onClick={() => act(() => adminApi.update("event-registrations", row.id, { status: "CONFIRMED" }), "Booking confirmed").catch(() => {})}>Confirm booking</Button>
          )}
          {isTrip && can.record_payment && Number(row.due) > 0 && (
            <Button variant="primary" onClick={() => setPaying(true)}>Record payment</Button>
          )}
          {can.cancel && open && (
            <Button variant="secondary" onClick={() => setPrompt({
              title: `Cancel ${row.reference}`,
              label: isTrip ? "Reason (a refund is requested automatically per the refund policy)" : "Reason",
              run: (reason) => act(() => isTrip ? adminApi.action("cancel-booking", { booking_id: row.id, reason })
                : adminApi.update("event-registrations", row.id, { status: "CANCELLED", staff_note: reason }), "Booking cancelled"),
            })}>Cancel booking</Button>
          )}
        </>}>
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-background-secondary-default p-3 text-center">
            <div><p className="text-caption-1-medium text-text-tertiary">Total</p><p className="text-body-medium font-semibold tabular-nums">{money(row.total)}</p></div>
            <div><p className="text-caption-1-medium text-text-tertiary">Paid</p><p className="text-body-medium font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">{money(row.paid)}</p></div>
            <div><p className="text-caption-1-medium text-text-tertiary">Due</p><p className={Number(row.due) > 0 ? "text-body-medium font-semibold tabular-nums text-rose-600 dark:text-rose-400" : "text-body-medium font-semibold tabular-nums"}>{money(row.due)}</p></div>
          </div>
          <Facts items={[
            [isTrip ? "Trip" : "Event", row.title], ["Date", relDay(row.starts_at)], ["People", row.people],
            ["Phone", row.phone ? <a key="p" href={`tel:${row.phone}`} className="inline-flex items-center gap-1 underline"><RiPhoneLine className="size-3.5" aria-hidden />{row.phone}</a> : "—"],
            ...(!isTrip ? [["UPI transaction ID", row.utr || "—"] as [string, React.ReactNode]] : []),
            ["Booked", dateTime(row.created_at)],
          ]} />
          {row.note && <p className="rounded-xl bg-background-secondary-default p-3 text-body-regular text-text-secondary">“{row.note}”</p>}
          {!isTrip && (row.proof_url
            ? <a href={row.proof_url} target="_blank" rel="noopener noreferrer"><p className="mb-1 text-caption-1-medium text-text-tertiary">Payment screenshot</p>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={row.proof_url} alt="Payment screenshot" className="w-full rounded-xl border border-border-button-default" /></a>
            : row.status === "PENDING" && <p className="rounded-xl border border-dashed border-border-button-default p-4 text-center text-body-regular text-text-tertiary">No payment screenshot uploaded yet.</p>)}
          <div className="flex flex-wrap gap-2">
            <ButtonLink size="small" variant="secondary" trailingIcon={RiArrowRightUpLine} href={`/admin/overview/${row.type}/${row.parent_id}?tab=bookings`}>Open {isTrip ? "trip" : "event"}</ButtonLink>
            {row.customer_id && <ButtonLink size="small" variant="secondary" trailingIcon={RiArrowRightUpLine} href={`/admin/customer/${row.customer_id}`}>Open customer</ButtonLink>}
          </div>
        </div>
      </Drawer>
      {prompt && <PromptModal {...prompt} onClose={() => setPrompt(null)} />}
      {paying && (
        <RecordPaymentModal
          reg={{ ...row, participants: row.people, outstanding: row.due, status_label: row.status_label, schedule_id: "", advance_due: row.advance_due }}
          onClose={() => setPaying(false)}
          onSave={(body) => act(() => adminApi.action("record-manual-payment", body), "Payment recorded. A second staff member must verify it.")} />
      )}
    </>
  );
}
