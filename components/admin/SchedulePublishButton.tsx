"use client";
/**
 * "Schedule…" next to Publish: the record goes live at a chosen time (content.tasks.publish_due runs every 5 minutes).
 * Once scheduled, the same place offers "Cancel schedule", which puts it back to draft.
 */
import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { toast } from "@/components/base/toast/toast";
import { adminApi } from "@/lib/admin/api";

/** A Date as the "YYYY-MM-DDTHH:mm" a datetime-local input shows, in the browser's time zone. */
const localInput = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
const inHalfAnHour = () => localInput(new Date(Date.now() + 30 * 60_000));

export function SchedulePublishButton({ resource, id, status, onChanged, disabled, size }: {
  resource: string; id: string; status: string; onChanged: () => void; disabled?: boolean; size?: "small";
}) {
  const [open, setOpen] = useState(false);
  const [publishAt, setPublishAt] = useState(inHalfAnHour);
  const [busy, setBusy] = useState(false);

  async function transition(body: Record<string, string>, done: string) {
    setBusy(true);
    try {
      await adminApi.action("content-transition", { resource, id, ...body });
      setOpen(false);
      toast(done, { status: "success" });
      onChanged();
    } catch (e: any) {
      toast(e.message || "Couldn't change the schedule", { status: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (status === "SCHEDULED") {
    return <Button size={size} variant="secondary" disabled={disabled || busy}
      onClick={() => transition({ status: "DRAFT" }, "Schedule cancelled: back to draft")}>Cancel schedule</Button>;
  }

  const when = new Date(publishAt);
  const valid = !Number.isNaN(when.getTime()) && when > new Date();
  return <>
    <Button size={size} variant="secondary" disabled={disabled} onClick={() => { setPublishAt(inHalfAnHour()); setOpen(true); }}>Schedule…</Button>
    {open && <Modal isOpen onOpenChange={(shown) => !shown && !busy && setOpen(false)} size="sm">
      {() => <>
        <ModalHeader title="Schedule publication" description="It goes live within five minutes of this time, as long as it still has an English title." />
        <ModalBody>
          <Input label="Publish at" type="datetime-local" value={publishAt} onChange={setPublishAt}
            errorMessage={publishAt && !valid ? "Choose a time in the future." : undefined} />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" disabled={busy || !valid}
            onClick={() => transition({ status: "SCHEDULED", publish_at: when.toISOString() }, "Publication scheduled")}>
            {busy ? "Scheduling…" : "Schedule"}
          </Button>
        </ModalFooter>
      </>}
    </Modal>}
  </>;
}
