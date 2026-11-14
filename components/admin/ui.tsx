"use client";
/**
 * The admin's shared building blocks. Every page uses these, so tables, statuses and money look the same everywhere.
 */
import { RiArrowLeftSLine, RiArrowRightSLine, RiCloseLine, RiDownload2Line, RiSearchLine } from "@remixicon/react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/base/buttons/button";
import { toast } from "@/components/base/toast/toast";
import { cx } from "@/utils/cx";

/* ---------- formatting ---------- */

export const money = (v: string | number | null | undefined, decimals = 0) =>
  `₹${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: decimals, minimumFractionDigits: 0 })}`;
export const dateTime = (v?: string | null) => (v ? new Date(v).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—");
export const dateOnly = (v?: string | null) => (v ? new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
export const nice = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

/** "3 min ago", "yesterday", "12 Mar". */
export function ago(v: string) {
  const s = (Date.now() - new Date(v).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 172800) return "yesterday";
  if (s < 604800) return `${Math.floor(s / 86400)} days ago`;
  return dateOnly(v);
}

/** "Today 6:00 am", "Tomorrow", "Sat 14 Dec". */
export function relDay(v: string) {
  const d = new Date(v);
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(d).setHours(0, 0, 0, 0) - t.getTime()) / 86400000);
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  if (diff === 0) return `Today · ${time}`;
  if (diff === 1) return `Tomorrow · ${time}`;
  return `${d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · ${time}`;
}

/* ---------- status ---------- */

type Tone = "green" | "amber" | "red" | "blue" | "gray";
const TONES: Record<Tone, string> = {
  green: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 ring-emerald-500/25",
  amber: "bg-amber-500/14 text-amber-800 dark:text-amber-400 ring-amber-500/30",
  red: "bg-rose-500/12 text-rose-700 dark:text-rose-400 ring-rose-500/25",
  blue: "bg-blue-500/12 text-blue-700 dark:text-blue-400 ring-blue-500/25",
  gray: "bg-background-secondary-default text-text-secondary ring-border-button-default",
};
export function toneOf(status: string): Tone {
  const s = status.toUpperCase();
  if (/(CANCEL|EXPIRED|REJECT|FAIL|NO_SHOW|LOST)/.test(s)) return "red";
  if (/(PENDING|AWAIT|DRAFT|SUBMITTED|REVIEW|CHANGES|NEW|PARTIAL)/.test(s)) return "amber";
  if (/(PAID|COMPLETE|CONFIRMED|SUCCEEDED|APPROVED|PUBLISHED|ACTIVE|CONVERTED|LIVE)/.test(s)) return "green";
  if (/(CONTACTED|QUALIFIED|PROCESS|OPEN)/.test(s)) return "blue";
  return "gray";
}
/** Status shown as a dot + word, never colour alone. */
export function StatusPill({ status, label, tone }: { status: string; label?: string; tone?: Tone }) {
  const t = tone ?? toneOf(status);
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-caption-1-medium ring-1 ring-inset", TONES[t])}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label ?? nice(status)}
    </span>
  );
}

/* ---------- people ---------- */

const AVATAR_BG = ["bg-blue-500/15 text-blue-700", "bg-emerald-500/15 text-emerald-700", "bg-violet-500/15 text-violet-700", "bg-amber-500/20 text-amber-800", "bg-rose-500/15 text-rose-700", "bg-cyan-500/15 text-cyan-700"];
export function Initials({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const letters = name.replace(/[^\p{L}\s]/gu, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  const hue = AVATAR_BG[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_BG.length];
  return (
    <span className={cx("grid shrink-0 place-items-center rounded-full font-semibold dark:brightness-125", hue,
      size === "sm" ? "size-7 text-[11px]" : size === "lg" ? "size-14 text-lg" : "size-9 text-xs")} aria-hidden>{letters}</span>
  );
}
export function Person({ name, sub, size }: { name: string; sub?: ReactNode; size?: "sm" | "md" }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Initials name={name} size={size} />
      <span className="min-w-0">
        <span className="block truncate text-body-medium text-text-primary">{name}</span>
        {sub && <span className="block truncate text-caption-1-medium text-text-tertiary">{sub}</span>}
      </span>
    </span>
  );
}

/* ---------- layout ---------- */

export function Card({ title, sub, action, children, className, pad = true }: { title?: ReactNode; sub?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cx("rounded-2xl border border-border-button-default bg-background-primary-default shadow-xs", className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-2 px-5 pb-1 pt-4">
          <div className="min-w-0">
            {title && <h2 className="text-headline-medium text-text-primary">{title}</h2>}
            {sub && <p className="text-body-regular text-text-secondary">{sub}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={pad ? "px-5 pb-5 pt-3" : ""}>{children}</div>
    </section>
  );
}

export function Empty({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-12 text-center">
      <p className="text-body-medium text-text-primary">{title}</p>
      {sub && <p className="max-w-sm text-body-regular text-text-tertiary">{sub}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/* ---------- filters ---------- */

/** Segmented status filter with counts: All 42 · Awaiting payment 5 · Paid 30 · Cancelled 7. */
export function FilterPills<K extends string>({ value, onChange, options }: { value: K; onChange: (k: K) => void; options: { key: K; label: string; count?: number }[] }) {
  return (
    <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-background-secondary-default p-1" role="tablist">
      {options.map((o) => (
        <button key={o.key} role="tab" aria-selected={value === o.key} onClick={() => onChange(o.key)}
          className={cx("flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-body-medium transition-colors",
            value === o.key ? "bg-background-primary-default text-text-primary shadow-xs" : "text-text-secondary hover:text-text-primary")}>
          {o.label}
          {o.count != null && <span className={cx("rounded-md px-1.5 text-caption-1-medium", value === o.key ? "bg-background-secondary-default" : "text-text-tertiary")}>{o.count.toLocaleString("en-IN")}</span>}
        </button>
      ))}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = "Search" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="flex h-10 w-full items-center gap-2 rounded-xl border border-border-button-default bg-background-primary-default px-3 focus-within:border-text-secondary sm:w-72">
      <RiSearchLine className="size-4 shrink-0 text-foreground-icon-tertiary" aria-hidden />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder}
        className="w-full bg-transparent text-body-medium text-text-primary outline-none placeholder:text-text-tertiary" />
      {value && <button onClick={() => onChange("")} aria-label="Clear search" className="text-foreground-icon-tertiary hover:text-text-primary"><RiCloseLine className="size-4" /></button>}
    </label>
  );
}

/* ---------- table ---------- */

export type Column<T> = { key: string; label: string; render: (row: T) => ReactNode; align?: "end"; className?: string; hideOnMobile?: boolean };

/**
 * The one table used across the admin: roomy rows, quiet header, whole row clickable, phone-friendly.
 * On small screens each row becomes a card (first column as the heading, the rest as label/value pairs).
 */
export function DataTable<T>({ rows, columns, rowKey, onRowClick, actions, empty, loading }: {
  rows: T[] | null; columns: Column<T>[]; rowKey: (r: T) => string;
  onRowClick?: (r: T) => void; actions?: (r: T) => ReactNode; empty?: ReactNode; loading?: boolean;
}) {
  if (!rows) return <div className="flex flex-col gap-2 p-4">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-background-secondary-default" />)}</div>;
  if (rows.length === 0) return <>{empty ?? <Empty title="Nothing here yet" />}</>;
  const [first, ...rest] = columns;
  return (
    <div className={cx(loading && "opacity-60 transition-opacity")}>
      <table className="w-full max-md:hidden">
        <thead>
          <tr className="border-b border-separator-border">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cx("px-4 py-2.5 text-caption-1-medium font-medium uppercase tracking-wide text-text-tertiary", c.align === "end" ? "text-end" : "text-start", c.className)}>{c.label}</th>
            ))}
            {actions && <th className="px-4 py-2.5"><span className="sr-only">Actions</span></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined}
              className={cx("border-b border-separator-border last:border-b-0 transition-colors", onRowClick && "cursor-pointer hover:bg-background-secondary-default/70")}>
              {columns.map((c) => (
                <td key={c.key} className={cx("px-4 py-3 align-middle text-body-medium text-text-primary", c.align === "end" && "text-end tabular-nums", c.className)}>{c.render(r)}</td>
              ))}
              {actions && <td className="px-4 py-3 text-end" onClick={(e) => e.stopPropagation()}><div className="flex justify-end gap-2">{actions(r)}</div></td>}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="flex flex-col gap-2 p-3 md:hidden">
        {rows.map((r) => (
          <li key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined}
            className={cx("rounded-xl border border-border-button-default p-3", onRowClick && "cursor-pointer active:bg-background-secondary-default")}>
            <div className="mb-2">{first.render(r)}</div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
              {rest.filter((c) => !c.hideOnMobile).map((c) => (
                <div key={c.key} className="min-w-0"><dt className="text-caption-1-medium text-text-tertiary">{c.label}</dt><dd className="text-body-medium text-text-primary">{c.render(r)}</dd></div>
              ))}
            </dl>
            {actions && <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>{actions(r)}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Pager({ page, pages, count, onChange }: { page: number; pages: number; count: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-separator-border px-4 py-3 text-body-regular text-text-secondary">
      <span>Page {page} of {pages} · {count.toLocaleString("en-IN")} total</span>
      <div className="flex gap-1">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page" className="grid size-8 place-items-center rounded-lg border border-border-button-default disabled:opacity-40 hover:bg-background-secondary-default"><RiArrowLeftSLine className="size-4" /></button>
        <button disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page" className="grid size-8 place-items-center rounded-lg border border-border-button-default disabled:opacity-40 hover:bg-background-secondary-default"><RiArrowRightSLine className="size-4" /></button>
      </div>
    </div>
  );
}

/* ---------- side panel ---------- */

/** Slides in from the right to show one record without leaving the list. Esc or the backdrop closes it. */
export function Drawer({ open, onClose, title, sub, children, footer }: { open: boolean; onClose: () => void; title: ReactNode; sub?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
      <button aria-label="Close" className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <aside className="absolute inset-y-0 end-0 flex w-full max-w-[440px] flex-col bg-background-primary-default shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-separator-border px-5 py-4">
          <div className="min-w-0"><h2 className="truncate text-title-3-semibold text-text-primary">{title}</h2>{sub && <div className="mt-0.5 text-body-regular text-text-secondary">{sub}</div>}</div>
          <button onClick={onClose} aria-label="Close" className="grid size-8 shrink-0 place-items-center rounded-lg hover:bg-background-secondary-default"><RiCloseLine className="size-5" /></button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex flex-wrap gap-2 border-t border-separator-border px-5 py-3">{footer}</footer>}
      </aside>
    </div>
  );
}

/** Label / value list used inside drawers and detail cards. */
export function Facts({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
      {items.map(([k, v]) => (
        <div key={k} className="min-w-0"><dt className="text-caption-1-medium text-text-tertiary">{k}</dt><dd className="break-words text-body-medium text-text-primary">{v}</dd></div>
      ))}
    </dl>
  );
}

/* ---------- numbers, dates, export ---------- */

/** One figure in a summary strip: label, big value, one line of context. `tone` colours the value when it needs attention. */
export function StatTile({ label, value, sub, tone, onClick }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "red" | "amber"; onClick?: () => void }) {
  const body = (
    <>
      <span className="block text-caption-1-medium text-text-tertiary">{label}</span>
      <span className={cx("mt-1 block text-title-3-semibold tabular-nums",
        tone === "red" ? "text-rose-600 dark:text-rose-400" : tone === "amber" ? "text-amber-700 dark:text-amber-400" : "text-text-primary")}>{value}</span>
      {sub && <span className="mt-0.5 block text-caption-1-medium text-text-secondary">{sub}</span>}
    </>
  );
  const box = "rounded-2xl border border-border-button-default bg-background-primary-default p-4 text-start shadow-xs";
  return onClick
    ? <button type="button" onClick={onClick} className={cx(box, "transition-colors hover:bg-background-secondary-default/70")}>{body}</button>
    : <div className={box}>{body}</div>;
}

export type DateRange = { from: string; to: string };

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Named ranges, worked out in the browser's local calendar (staff are in India, the same as the server). */
function presetRanges(): { key: string; label: string; range: DateRange }[] {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const daysAgo = (n: number) => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };
  return [
    { key: "all", label: "All time", range: { from: "", to: "" } },
    { key: "month", label: "This month", range: { from: iso(new Date(y, m, 1)), to: iso(now) } },
    { key: "last-month", label: "Last month", range: { from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0)) } },
    { key: "30d", label: "Last 30 days", range: { from: iso(daysAgo(29)), to: iso(now) } },
  ];
}

/** Date filter: a few named ranges plus "Custom" with two date boxes. Empty strings mean "no limit". */
export function DateRangeFilter({ value, onChange, label = "Date" }: { value: DateRange; onChange: (r: DateRange) => void; label?: string }) {
  const presets = presetRanges();
  const matched = presets.find((p) => p.range.from === value.from && p.range.to === value.to)?.key;
  const [custom, setCustom] = useState(!matched);
  const selected = custom ? "custom" : matched ?? "custom";
  const field = "h-10 rounded-xl border border-border-button-default bg-background-primary-default px-3 text-body-medium text-text-primary outline-none focus:border-text-secondary";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="date-range">{label}</label>
      <select id="date-range" value={selected} className={field}
        onChange={(e) => {
          const preset = presets.find((p) => p.key === e.target.value);
          setCustom(!preset);
          if (preset) onChange(preset.range);
        }}>
        {presets.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        <option value="custom">Custom dates…</option>
      </select>
      {selected === "custom" && (
        <>
          <input type="date" aria-label="From" className={field} value={value.from} max={value.to || undefined} onChange={(e) => onChange({ ...value, from: e.target.value })} />
          <span className="text-text-tertiary" aria-hidden>–</span>
          <input type="date" aria-label="To" className={field} value={value.to} min={value.from || undefined} onChange={(e) => onChange({ ...value, to: e.target.value })} />
        </>
      )}
    </div>
  );
}

/** "Export CSV" button: downloads the rows that match the current filters. */
export function ExportButton({ onExport, label = "Export CSV" }: { onExport: () => Promise<void>; label?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button variant="secondary" leadingIcon={RiDownload2Line} disabled={busy}
      onClick={async () => {
        setBusy(true);
        try { await onExport(); } catch (e: any) { toast(e?.message || "Export failed", { status: "error" }); } finally { setBusy(false); }
      }}>
      {busy ? "Preparing…" : label}
    </Button>
  );
}

/** Page title row: big title, one line of context, actions on the right. */
export function PageTitle({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-title-1-semibold tracking-tight text-text-primary">{title}</h1>
        {sub && <p className="mt-1 text-body-regular text-text-secondary">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
