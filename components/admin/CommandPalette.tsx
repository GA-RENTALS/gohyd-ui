"use client";
import { RiArrowRightLine, RiCornerDownLeftLine, RiSearchLine } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { adminApi, type SearchHit } from "@/lib/admin/api";
import type { NavSection } from "@/lib/admin/nav";
import { cx } from "@/utils/cx";

/** ⌘K: jump to any page, or find a trip, event, booking or customer by name, phone or reference. */
export function CommandPalette({ open, onClose, nav }: { open: boolean; onClose: () => void; nav: NavSection[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [i, setI] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) { setQ(""); setHits([]); setI(0); setTimeout(() => input.current?.focus(), 10); } }, [open]);
  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    setLoading(true);
    const t = setTimeout(() => {
      adminApi.search(q.trim()).then((r) => { setHits(r.results); setI(0); }).catch(() => setHits([])).finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const pages: SearchHit[] = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return nav.flatMap((s) => s.items).filter((it) => !needle || it.label.toLowerCase().includes(needle))
      .map((it) => ({ type: "Go to", label: it.label, sub: "", href: it.href }));
  }, [nav, q]);
  const all = [...hits, ...pages];

  if (!open) return null;
  const go = (h?: SearchHit) => { if (!h) return; onClose(); router.push(h.href); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(x + 1, all.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(x - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); go(all[i]); }
  };

  let groupStart = "";
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search">
      <button aria-label="Close search" className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border-button-default bg-background-primary-default shadow-2xl" onKeyDown={onKey}>
        <div className="flex items-center gap-3 border-b border-separator-border px-4">
          <RiSearchLine className="size-5 text-foreground-icon-tertiary" aria-hidden />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search trips, events, bookings, customers, phone, reference…"
            className="h-14 flex-1 bg-transparent text-body-medium text-text-primary outline-none placeholder:text-text-tertiary" aria-label="Search" />
          {loading && <span className="size-4 animate-spin rounded-full border-2 border-text-tertiary border-t-transparent" aria-hidden />}
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
          {q.trim().length >= 2 && !loading && hits.length === 0 && <li className="px-3 py-3 text-body-regular text-text-tertiary">No trips, events, bookings or customers match “{q}”.</li>}
          {all.map((h, idx) => {
            const header = h.type !== groupStart ? (groupStart = h.type) : null;
            return (
              <li key={`${h.href}-${idx}`}>
                {header && <p className="px-3 pb-1 pt-2 text-caption-1-medium uppercase tracking-wider text-text-tertiary">{header}</p>}
                <button role="option" aria-selected={idx === i} onMouseEnter={() => setI(idx)} onClick={() => go(h)}
                  className={cx("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start", idx === i && "bg-background-secondary-default")}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body-medium text-text-primary">{h.label}</span>
                    {h.sub && <span className="block truncate text-caption-1-medium text-text-tertiary">{h.sub}</span>}
                  </span>
                  {idx === i ? <RiCornerDownLeftLine className="size-4 text-foreground-icon-tertiary" aria-hidden /> : <RiArrowRightLine className="size-4 text-transparent" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="border-t border-separator-border px-4 py-2 text-caption-1-medium text-text-tertiary">↑ ↓ to move · Enter to open · Esc to close</p>
      </div>
    </div>
  );
}
