"use client";
/**
 * "Cancel this date" on a trip departure or event date (weather, too few people, venue problem).
 * One step cancels every active booking with the same reason, requests each refund and messages each customer
 * (POST /admin/actions/cancel-date/, bookings.services.cancel_trip_date / trips.event_booking.cancel_event_date).
 */
import { useState } from "react";
import { FormModal, useFormSubmit } from "@/components/admin/FormModal";
import { FilterPills } from "@/components/admin/ui";
import { Button } from "@/components/base/buttons/button";
import { Textarea } from "@/components/base/textarea/textarea";
import { toast } from "@/components/base/toast/toast";
import { adminApi } from "@/lib/admin/api";

type Refund = "full" | "policy";

/** `booked`: people with an active booking on the date (seats taken), shown so staff see what the click affects. */
export function CancelDateButton({ kind, scheduleId, label, booked, onDone }: {
  kind: "trip" | "event"; scheduleId: string; label: string; booked: number; onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [refund, setRefund] = useState<Refund>("full");
  const { busy, errors, general, submit } = useFormSubmit();

  const save = async () => {
    let cancelled = 0;
    const ok = await submit(async () => {
      ({ cancelled } = await adminApi.action("cancel-date", { kind, schedule_id: scheduleId, reason: reason.trim(), refund }) as { cancelled: number });
    });
    if (!ok) return;
    setOpen(false);
    toast(cancelled ? `Date cancelled: ${cancelled} booking${cancelled === 1 ? "" : "s"} cancelled and customers told` : "Date cancelled", { status: "success" });
    onDone();
  };

  return <>
    <Button size="small" variant="secondary" onClick={() => { setReason(""); setRefund("full"); setOpen(true); }}>Cancel this date</Button>
    {open && (
      <FormModal title={`Cancel ${label}`} submitLabel={busy ? "Cancelling…" : booked ? "Cancel date and its bookings" : "Cancel date"}
        description={booked
          ? `${booked} ${booked === 1 ? "person is" : "people are"} booked. Every booking on this date is cancelled, its seats are released, a refund is requested and the customer gets the cancellation message. This can't be undone.`
          : "Nobody has booked this date. It stops taking bookings."}
        busy={busy} general={general} canSubmit={!!reason.trim()} onSubmit={save} onClose={() => setOpen(false)}>
        <Textarea label="Reason (customers see this)" value={reason} onChange={setReason} rows={3}
          placeholder="Heavy rain is forecast for the route, so this departure is cancelled for everyone's safety." hint={errors.reason} isInvalid={!!errors.reason} />
        {booked > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-body-medium text-text-primary">Refund</span>
            <FilterPills value={refund} onChange={setRefund} options={[
              { key: "full", label: "Everything they paid" }, { key: "policy", label: "Their refund policy" },
            ]} />
            <p className="text-caption-1-medium text-text-tertiary">
              {refund === "full" ? "Usual when you cancel: customers get back all they paid." : "Each customer gets the share their cancellation policy gives today."}
              {kind === "trip" ? " Online payments are refunded after finance approves each refund." : " Event refunds are listed under Payments → Event refunds to send by UPI."}
            </p>
          </div>
        )}
      </FormModal>
    )}
  </>;
}
