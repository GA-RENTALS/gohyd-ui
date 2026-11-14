"use client";
/** Small helpers shared by the marketing tabs. */
import { RiFileCopyLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { toast } from "@/components/base/toast/toast";
import { adminApi } from "@/lib/admin/api";

export type TabProps<T> = {
  rows: T[] | null;
  loading: boolean;
  can: { create: boolean; update: boolean; add_cost?: boolean };
  /** Reload the list (and the summary) after a change. */
  onChanged: () => void;
  /** The "New …" form is open (the button lives in the page header). */
  creating: boolean;
  onCloseCreate: () => void;
};

/** "2026-11-30" → start or end of that day in the browser's time zone, as an ISO timestamp for the API. */
export const dayStart = (day: string) => (day ? new Date(`${day}T00:00:00`).toISOString() : null);
export const dayEnd = (day: string) => (day ? new Date(`${day}T23:59:59`).toISOString() : null);

/** ISO timestamp → "2026-11-30" for a date input. */
export const toDay = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** "Diwali Treks 2026" → "diwali-treks-2026", the form used in utm_campaign tags. */
export const slugify = (text: string) => text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);

export async function copyText(text: string, what = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    toast(what, { status: "success" });
  } catch {
    toast("Couldn't copy. Select the text and copy it by hand.", { status: "error" });
  }
}

export function CopyButton({ text, label }: { text: string; label: string }) {
  return <Button size="small" variant="secondary" iconOnly leadingIcon={RiFileCopyLine} aria-label={label} onClick={() => copyText(text, `${label}: copied`)} />;
}

/** Pause / resume through the generic resources API (keeps validation and the audit log in one place). */
export const setActive = (resource: string, id: string, isActive: boolean) => adminApi.update(resource, id, { is_active: isActive });
