"use client";
/**
 * The homepage numbers ("12,500+ community members") as a small form instead of raw JSON.
 * Saves the `homepage.stats` business setting; the API keeps only well-formed rows (content/site_settings.clean_stats).
 */
import { RiAddLine, RiDeleteBin6Line } from "@remixicon/react";
import { useState } from "react";
import { FormModal, useFormSubmit } from "@/components/admin/FormModal";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { adminApi } from "@/lib/admin/api";

type Stat = { value: number; suffix?: string; decimals?: number; label: string };
type Row = { value: string; suffix: string; label: string };
const MAX = 4;

const toRow = (s: Stat): Row => ({ value: String(s.value ?? ""), suffix: s.suffix ?? "", label: s.label ?? "" });
const decimalsOf = (value: string) => Math.min(2, value.includes(".") ? value.split(".")[1].length : 0);

export function HomepageStatsForm({ settingId, value, onClose, onSaved }: {
  settingId: string; value: unknown; onClose: () => void; onSaved: () => void;
}) {
  const [rows, setRows] = useState<Row[]>(() => (Array.isArray(value) ? (value as Stat[]).slice(0, MAX).map(toRow) : []));
  const { busy, general, submit } = useFormSubmit();
  const set = (i: number, k: keyof Row) => (v: string) => setRows((r) => r.map((row, j) => (j === i ? { ...row, [k]: v } : row)));
  const complete = rows.every((r) => r.label.trim() && r.value.trim() !== "" && !Number.isNaN(Number(r.value)));

  const save = async () => {
    const stats: Stat[] = rows.map((r) => ({ value: Number(r.value), suffix: r.suffix.trim(), decimals: decimalsOf(r.value.trim()), label: r.label.trim() }));
    if (await submit(() => adminApi.update("settings", settingId, { value: stats }))) onSaved();
  };

  return (
    <FormModal title="Homepage numbers" description="Up to four numbers shown on the homepage. Remove them all to hide the section."
      submitLabel="Save numbers" busy={busy} general={general} canSubmit={complete} onSubmit={save} onClose={onClose}>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,1fr)_72px_minmax(0,2fr)_auto] items-end gap-2">
          <Input label="Number" inputMode="decimal" value={r.value} onChange={set(i, "value")} placeholder="12500" />
          <Input label="After it" value={r.suffix} onChange={set(i, "suffix")} placeholder="+" maxLength={6} />
          <Input label="Label" value={r.label} onChange={set(i, "label")} placeholder="Community members" maxLength={80} />
          <Button type="button" variant="secondary" iconOnly leadingIcon={RiDeleteBin6Line} aria-label={`Remove ${r.label || "this number"}`}
            onClick={() => setRows((all) => all.filter((_, j) => j !== i))} />
        </div>
      ))}
      {rows.length < MAX && (
        <Button type="button" variant="secondary" leadingIcon={RiAddLine} onClick={() => setRows((r) => [...r, { value: "", suffix: "+", label: "" }])}>
          Add a number
        </Button>
      )}
    </FormModal>
  );
}
