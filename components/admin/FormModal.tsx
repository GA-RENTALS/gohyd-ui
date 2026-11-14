"use client";
/**
 * A small form in a modal, used by the Marketing and Team pages. The server validates; this shows its answer next to
 * the right field (or above the buttons when it isn't about one field).
 */
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/base/buttons/button";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { ApiError } from "@/lib/admin/api";

export type FieldErrors = Record<string, string>;

/** Turns a DRF error body ({"code": ["Already used."]}) into one message per field. */
function fieldErrors(error: unknown): { fields: FieldErrors; general: string } {
  if (error instanceof ApiError && error.body && typeof error.body === "object" && !("detail" in (error.body as object))) {
    const fields: FieldErrors = {};
    for (const [key, value] of Object.entries(error.body as Record<string, unknown>)) {
      fields[key] = Array.isArray(value) ? String(value[0]) : String(value);
    }
    const general = fields.non_field_errors ?? "";
    delete fields.non_field_errors;
    return { fields, general };
  }
  return { fields: {}, general: error instanceof Error ? error.message : "Something went wrong" };
}

/** Submit handler with busy state and server errors. `submit` returns true when the save worked. */
export function useFormSubmit() {
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [general, setGeneral] = useState("");
  async function submit(save: () => Promise<unknown>): Promise<boolean> {
    setBusy(true);
    setErrors({});
    setGeneral("");
    try {
      await save();
      return true;
    } catch (e) {
      const { fields, general: message } = fieldErrors(e);
      setErrors(fields);
      setGeneral(message || (Object.keys(fields).length ? "" : "Something went wrong"));
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, errors, general, submit };
}

export function FormModal({ title, description, submitLabel, busy, general, onSubmit, onClose, children, canSubmit = true }: {
  title: string; description?: string; submitLabel: string; busy: boolean; general?: string;
  onSubmit: () => void; onClose: () => void; children: ReactNode; canSubmit?: boolean;
}) {
  const handle = (e: FormEvent) => { e.preventDefault(); if (!busy && canSubmit) onSubmit(); };
  return (
    <Modal isOpen onOpenChange={(open) => !open && onClose()} size="md">
      {() => (
        <form onSubmit={handle} noValidate>
          <ModalHeader title={title} description={description} />
          <ModalBody>
            <div className="flex flex-col gap-4">
              {children}
              {general && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-body-regular text-rose-700 dark:text-rose-400">{general}</p>}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={busy || !canSubmit}>{busy ? "Saving…" : submitLabel}</Button>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}
