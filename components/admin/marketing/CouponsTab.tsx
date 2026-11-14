"use client";
import { useState } from "react";
import { FormModal, useFormSubmit } from "@/components/admin/FormModal";
import { useAction } from "@/components/admin/hooks";
import { type Column, DataTable, dateOnly, Empty, FilterPills, money, StatusPill } from "@/components/admin/ui";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { adminApi, type CouponRow } from "@/lib/admin/api";
import { CopyButton, dayEnd, dayStart, setActive, type TabProps } from "./shared";

const STATE_LABEL: Record<CouponRow["state"], string> = { active: "Live", scheduled: "Starts later", ended: "Ended", paused: "Paused" };
const STATE_TONE: Record<CouponRow["state"], "green" | "blue" | "gray" | "amber"> = { active: "green", scheduled: "blue", ended: "gray", paused: "amber" };

export function CouponsTab({ rows, loading, can, onChanged, creating, onCloseCreate }: TabProps<CouponRow>) {
  const { busy, run } = useAction(onChanged);
  const toggle = (c: CouponRow) =>
    run(c.id, () => setActive("coupons", c.id, !c.is_active), c.is_active ? `${c.code} paused` : `${c.code} is live again`).catch(() => {});

  const columns: Column<CouponRow>[] = [
    { key: "code", label: "Code", render: (c) => (
      <span className="flex items-center gap-2">
        <span className="font-mono text-body-medium font-semibold tracking-wide">{c.code}</span>
        <CopyButton text={c.code} label={`Copy ${c.code}`} />
      </span>
    ) },
    { key: "discount", label: "Discount", render: (c) => <span>{c.discount_label}<span className="block text-caption-1-medium text-text-tertiary">{c.trips_text}</span></span> },
    { key: "state", label: "Status", render: (c) => <StatusPill status={c.state} label={STATE_LABEL[c.state]} tone={STATE_TONE[c.state]} /> },
    { key: "uses", label: "Used", align: "end", render: (c) => <span>{c.uses}{c.max_redemptions != null && <span className="text-text-tertiary"> / {c.max_redemptions}</span>}</span> },
    { key: "given", label: "Discount given", align: "end", render: (c) => Number(c.discount_total) > 0 ? money(c.discount_total) : <span className="text-text-tertiary">—</span> },
    { key: "dates", label: "Valid", hideOnMobile: true, render: (c) => <span className="whitespace-nowrap text-text-secondary">{validity(c)}</span> },
  ];

  return (
    <>
      <DataTable rows={rows} loading={loading} rowKey={(c) => c.id} columns={columns}
        actions={can.update ? (c) => (
          <Button size="small" variant="secondary" disabled={busy === c.id} onClick={() => toggle(c)}>{c.is_active ? "Pause" : "Resume"}</Button>
        ) : undefined}
        empty={<Empty title="No coupons here" sub="Create a code customers can enter at checkout, e.g. MONSOON10." />} />
      {creating && <CouponForm onClose={onCloseCreate} onSaved={() => { onCloseCreate(); onChanged(); }} />}
    </>
  );
}

function validity(c: CouponRow) {
  if (!c.valid_from && !c.valid_until) return "No end date";
  if (!c.valid_from) return `Until ${dateOnly(c.valid_until)}`;
  if (!c.valid_until) return `From ${dateOnly(c.valid_from)}`;
  return `${dateOnly(c.valid_from)} – ${dateOnly(c.valid_until)}`;
}

function CouponForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("");
  const [limit, setLimit] = useState("");
  const [perPerson, setPerPerson] = useState("1");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const { busy, errors, general, submit } = useFormSubmit();

  const amount = Number(value);
  const valid = code.trim().length > 0 && amount > 0 && (kind === "fixed" || amount <= 100);

  const save = async () => {
    const ok = await submit(() => adminApi.create("coupons", {
      code: code.trim().toUpperCase(),
      percent_basis_points: kind === "percent" ? Math.round(amount * 100) : null,
      fixed_amount: kind === "fixed" ? amount.toFixed(2) : null,
      max_redemptions: limit ? Number(limit) : null,
      per_user_limit: Number(perPerson) || 1,
      valid_from: dayStart(from),
      valid_until: dayEnd(until),
      is_active: true,
    }));
    if (ok) onSaved();
  };

  return (
    <FormModal title="New coupon" description="Customers type this code at checkout or when booking an event. It works on every trip and event; to limit it to some, edit it under All data → Coupons."
      submitLabel="Create coupon" busy={busy} general={general} canSubmit={valid} onSubmit={save} onClose={onClose}>
      <Input label="Code" value={code} onChange={(v) => setCode(v.toUpperCase().replace(/\s/g, ""))} placeholder="MONSOON10" errorMessage={errors.code} />
      <div className="flex flex-col gap-2">
        <span className="text-body-medium text-text-primary">Discount</span>
        <FilterPills value={kind} onChange={setKind} options={[{ key: "percent", label: "Percentage off" }, { key: "fixed", label: "Fixed amount off" }]} />
        <Input aria-label={kind === "percent" ? "Percent off" : "Amount off in rupees"} type="number" value={value} onChange={setValue}
          placeholder={kind === "percent" ? "10" : "500"} hint={kind === "percent" ? "Percent of the trip price, before GST." : "Rupees off the order, before GST."}
          errorMessage={errors.percent_basis_points || errors.fixed_amount} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Total uses (optional)" type="number" value={limit} onChange={setLimit} placeholder="No limit" errorMessage={errors.max_redemptions} />
        <Input label="Uses per customer" type="number" value={perPerson} onChange={setPerPerson} errorMessage={errors.per_user_limit} />
        <Input label="Starts (optional)" type="date" value={from} onChange={setFrom} errorMessage={errors.valid_from} />
        <Input label="Ends (optional)" type="date" value={until} onChange={setUntil} errorMessage={errors.valid_until} />
      </div>
    </FormModal>
  );
}
