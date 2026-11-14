"use client";
import {
  RiAddLine, RiAlertLine, RiArrowDownLine, RiArrowRightSLine, RiArrowUpLine, RiCalendarEventLine, RiCheckboxCircleLine, RiCheckLine,
  RiPhoneLine, RiRoadMapLine, RiTicket2Line, RiWallet3Line,
} from "@remixicon/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PromptModal } from "@/components/admin/ResourceView";
import { useAdmin } from "@/components/admin/Shell";
import { ago, Card, Drawer, Facts, Initials, money, relDay, StatusPill } from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/base/buttons/button";
import { toast } from "@/components/base/toast/toast";
import { useCountUp } from "@/hooks/use-count-up";
import { adminApi, type BookingRow, type Home } from "@/lib/admin/api";
import { cx } from "@/utils/cx";

const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };

export default function Dashboard() {
  const { refreshCounts } = useAdmin();
  const [d, setD] = useState<Home | null>(null);
  const [err, setErr] = useState("");
  const [proof, setProof] = useState<BookingRow | null>(null);
  const [prompt, setPrompt] = useState<{ title: string; label: string; run: (t: string) => Promise<void> } | null>(null);
  const [busy, setBusy] = useState("");

  const load = useCallback(() => { adminApi.home().then((x) => { setD(x); setErr(""); }).catch((e) => setErr(e.message)); }, []);
  useEffect(load, [load]);

  /** Do something from the to-do list, then refresh the page and the sidebar badges. */
  async function act(key: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(key);
    try { await fn(); toast(ok, { status: "success" }); load(); refreshCounts(); }
    catch (e: any) { toast(e.message || "Something went wrong", { status: "error" }); throw e; }
    finally { setBusy(""); }
  }
  const quiet = (p: Promise<unknown>) => p.catch(() => {});

  if (err) return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <p className="text-body-medium text-text-error-primary">{err}</p>
      <Button variant="secondary" onClick={load}>Try again</Button>
    </div>
  );
  if (!d) return <DashboardSkeleton />;

  const t = d.todo;
  const waiting = (t.verify_payments?.count ?? 0) + (t.confirm_events?.count ?? 0) + (t.balance_due?.count ?? 0) + (t.enquiries?.count ?? 0);
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      {/* ---------- greeting ---------- */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-body-regular text-text-tertiary">{today}</p>
          <h1 className="text-title-1-semibold tracking-tight text-text-primary">{greeting()}{d.name ? `, ${d.name}` : ""}</h1>
          <p className="mt-1 text-body-regular text-text-secondary">
            {waiting ? <>You have <strong className="text-text-primary">{waiting} thing{waiting === 1 ? "" : "s"}</strong> waiting below.</> : "Everything is up to date. Nice work."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {d.can.add_trip && <ButtonLink href="/admin/trips?new=1" variant="secondary" leadingIcon={RiAddLine}>New trip</ButtonLink>}
          {d.can.add_event && <ButtonLink href="/admin/events?new=1" variant="primary" leadingIcon={RiAddLine}>New event</ButtonLink>}
        </div>
      </header>

      <SetupBanner items={d.setup} />

      {/* ---------- headline numbers ---------- */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {d.kpis.map((k) => <Kpi {...k} key={k.key} />)}
        <a href="#todo" className="group rounded-2xl border border-border-button-default bg-background-primary-default p-4 shadow-xs transition-colors hover:border-border-button-hover">
          <p className="text-body-regular text-text-secondary">Waiting on you</p>
          <p className={cx("mt-1 text-title-1-semibold tabular-nums", waiting ? "text-accent-600" : "text-text-primary")}>{waiting}</p>
          <p className="mt-1 flex items-center gap-1 text-caption-1-medium text-text-tertiary">{waiting ? "Payments, confirmations, enquiries" : "All caught up"}<RiArrowRightSLine className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden /></p>
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* ---------- to do ---------- */}
        <Card className="xl:col-span-2" title={<span id="todo">To do</span>} sub="Act on these right here: no need to open another page." pad={false}>
          {waiting === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 pb-10 pt-6 text-center">
              <RiCheckboxCircleLine className="size-10 text-emerald-500" aria-hidden />
              <p className="text-body-medium text-text-primary">All caught up</p>
              <p className="text-body-regular text-text-tertiary">New payments, bookings and enquiries will show up here.</p>
            </div>
          ) : (
            <div className="divide-y divide-separator-border">
              {!!t.confirm_events?.count && (
                <TodoGroup icon={RiTicket2Line} title="Event bookings to confirm" count={t.confirm_events.count}
                  note={t.confirm_events.with_proof ? `${t.confirm_events.with_proof} sent a payment screenshot` : undefined} href="/admin/payments?type=event&status=pending">
                  {t.confirm_events.items.map((r) => (
                    <TodoRow key={r.id}
                      lead={<button onClick={() => setProof(r)} className="grid h-11 w-9 shrink-0 place-items-center overflow-hidden rounded-md border border-border-button-default bg-background-secondary-default" aria-label="See payment screenshot">
                        {r.proof_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={r.proof_url} alt="" className="size-full object-cover" /> : <span className="text-[10px] text-text-tertiary">No proof</span>}
                      </button>}
                      title={<>{r.name} <span className="text-text-tertiary">× {r.people}</span></>}
                      sub={<>{r.title} · {ago(r.created_at)}</>}
                      amount={money(r.total)}
                      actions={d.can.confirm_event && <>
                        <Button size="small" variant="secondary" onClick={() => setProof(r)}>Check</Button>
                        <Button size="small" variant="primary" leadingIcon={RiCheckLine} disabled={busy === r.id}
                          onClick={() => quiet(act(r.id, () => adminApi.update("event-registrations", r.id, { status: "CONFIRMED" }), `${r.name}'s booking confirmed`))}>Confirm</Button>
                      </>} />
                  ))}
                </TodoGroup>
              )}
              {!!t.verify_payments?.count && (
                <TodoGroup icon={RiWallet3Line} title="Payments to verify" count={t.verify_payments.count} note="Cash or bank transfers recorded by staff" href="/admin/payments?status=pending">
                  {t.verify_payments.items.map((p) => (
                    <TodoRow key={p.id} lead={<Initials name={p.payer} />} title={p.payer}
                      sub={<>{p.title || "Trip"} · ref {p.reference || "—"} · {ago(p.created_at)}</>} amount={money(p.amount)}
                      actions={d.can.verify_payment && <>
                        <Button size="small" variant="secondary" onClick={() => setPrompt({ title: "Reject payment", label: "Why is it rejected?", run: (note) => act(p.id, () => adminApi.action("verify-payment", { payment_id: p.id, approved: false, note }), "Payment rejected") })}>Reject</Button>
                        <Button size="small" variant="primary" leadingIcon={RiCheckLine} disabled={busy === p.id}
                          onClick={() => quiet(act(p.id, () => adminApi.action("verify-payment", { payment_id: p.id, approved: true }), "Payment verified"))}>Verify</Button>
                      </>} />
                  ))}
                </TodoGroup>
              )}
              {!!t.balance_due?.count && (
                <TodoGroup icon={RiRoadMapLine} title="Balance due before departure" count={t.balance_due.count} note="Trips leaving in the next 14 days" href="/admin/bookings?status=awaiting">
                  {t.balance_due.items.map((b) => (
                    <TodoRow key={b.id} lead={<Initials name={b.name} />} title={b.name} sub={<>{b.title} · leaves {relDay(b.starts_at)}</>}
                      amount={<span className="text-rose-600 dark:text-rose-400">{money(b.due)} due</span>}
                      actions={<>
                        {b.phone && <a href={`tel:${b.phone}`} className="inline-flex h-8 items-center gap-1 rounded-lg border border-border-button-default px-2.5 text-body-medium hover:bg-background-secondary-default"><RiPhoneLine className="size-4" aria-hidden />Call</a>}
                        <ButtonLink size="small" variant="secondary" href={`/admin/overview/trip/${b.parent_id}?tab=bookings`}>Open</ButtonLink>
                      </>} />
                  ))}
                </TodoGroup>
              )}
              {!!t.enquiries?.count && (
                <TodoGroup icon={RiPhoneLine} title="New enquiries" count={t.enquiries.count} note="People waiting for a call back" href="/admin/crm/enquiries">
                  {t.enquiries.items.map((e) => (
                    <TodoRow key={e.id} lead={<Initials name={e.name} />} title={e.name} sub={<span className="line-clamp-1">{e.message || "No message"} · {ago(e.created_at)}</span>}
                      actions={<>
                        {e.phone && <a href={`tel:${e.phone}`} className="inline-flex h-8 items-center gap-1 rounded-lg border border-border-button-default px-2.5 text-body-medium hover:bg-background-secondary-default"><RiPhoneLine className="size-4" aria-hidden />Call</a>}
                        <Button size="small" variant="primary" disabled={busy === e.id}
                          onClick={() => quiet(act(e.id, () => adminApi.update("enquiries", e.id, { status: "CONTACTED" }), `${e.name} marked as contacted`))}>Mark contacted</Button>
                      </>} />
                  ))}
                </TodoGroup>
              )}
            </div>
          )}
        </Card>

        {/* ---------- next 14 days ---------- */}
        <Card title="Coming up" sub="Trips and events in the next 14 days">
          {d.upcoming.length === 0 ? (
            <p className="py-8 text-center text-body-regular text-text-tertiary">Nothing scheduled in the next two weeks.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {d.upcoming.slice(0, 8).map((u) => {
                const pct = u.capacity ? Math.min(100, Math.round((u.booked / u.capacity) * 100)) : null;
                const Icon = u.kind === "trip" ? RiRoadMapLine : RiCalendarEventLine;
                return (
                  <li key={u.schedule_id}>
                    <Link href={`/admin/overview/${u.kind}/${u.parent_id}`} className="flex gap-3 rounded-xl p-2 transition-colors hover:bg-background-secondary-default">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-background-secondary-default"><Icon className="size-[18px] text-foreground-icon-secondary" aria-hidden /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body-medium text-text-primary">{u.title}</span>
                        <span className="block text-caption-1-medium text-text-tertiary">{relDay(u.starts_at)}</span>
                        <span className="mt-1.5 flex items-center gap-2">
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-chart-track)]">
                            <span className="block h-full rounded-full bg-[var(--color-chart-1-active)]" style={{ width: `${pct ?? 100}%`, opacity: pct == null ? 0.35 : 1 }} />
                          </span>
                          <span className="shrink-0 text-caption-1-medium tabular-nums text-text-secondary">{u.booked}{u.capacity != null ? `/${u.capacity}` : ""}</span>
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* ---------- money ---------- */}
        <RevenueCard className="xl:col-span-2" data={d.revenue_30d} />

        <Card title="Best sellers" sub="Revenue in the last 90 days">
          {d.top.length === 0 ? <p className="py-8 text-center text-body-regular text-text-tertiary">No sales in the last 90 days yet.</p> : (
            <ul className="flex flex-col gap-3">
              {d.top.map((x) => {
                const max = Math.max(...d.top.map((y) => Number(y.revenue))) || 1;
                return (
                  <li key={`${x.kind}-${x.parent_id}`}>
                    <Link href={`/admin/overview/${x.kind}/${x.parent_id}`} className="group block">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-body-medium text-text-primary group-hover:underline">{x.title}</span>
                        <span className="shrink-0 text-body-medium tabular-nums text-text-primary">{money(x.revenue)}</span>
                      </span>
                      <span className="mt-1 flex items-center gap-2">
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-chart-track)]">
                          <span className="block h-full rounded-full bg-[var(--color-chart-1-active)]" style={{ width: `${Math.max(4, (Number(x.revenue) / max) * 100)}%` }} />
                        </span>
                        <span className="w-24 shrink-0 text-end text-caption-1-medium text-text-tertiary">{x.kind === "trip" ? "Trip" : "Event"} · {x.bookings} booked</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* ---------- activity ---------- */}
        <Card className="xl:col-span-3" title="Latest activity" sub="New bookings and payments as they happen">
          {d.activity.length === 0 ? <p className="py-8 text-center text-body-regular text-text-tertiary">No activity yet.</p> : (
            <ul className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
              {d.activity.map((a, i) => (
                <li key={i} className="border-b border-separator-border last:border-b-0 md:[&:nth-last-child(2):nth-child(odd)]:border-b-0">
                  <Link href={a.href} className="flex items-center gap-3 py-3 hover:opacity-80">
                    <Initials name={a.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body-medium text-text-primary"><strong className="font-medium">{a.name}</strong> <span className="text-text-secondary">{a.text}</span></span>
                      <span className="block text-caption-1-medium text-text-tertiary">{ago(a.at)}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-body-medium tabular-nums text-text-primary">{money(a.amount)}</span>
                      <StatusPill status={a.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="mt-6 text-center text-caption-1-medium text-text-tertiary">Updated {ago(d.as_of)} · <button className="underline" onClick={load}>Refresh</button></p>

      {/* payment screenshot check */}
      <Drawer open={!!proof} onClose={() => setProof(null)} title={proof ? `${proof.name} × ${proof.people}` : ""} sub={proof ? `${proof.reference} · ${proof.title}` : ""}
        footer={proof && d.can.confirm_event && <>
          <Button variant="primary" leadingIcon={RiCheckLine} disabled={busy === proof.id}
            onClick={() => quiet(act(proof.id, () => adminApi.update("event-registrations", proof.id, { status: "CONFIRMED" }), "Booking confirmed").then(() => setProof(null)))}>Confirm booking</Button>
          <Button variant="secondary" onClick={() => setPrompt({ title: `Cancel ${proof.reference}`, label: "Reason", run: (reason) => act(proof.id, () => adminApi.update("event-registrations", proof.id, { status: "CANCELLED", staff_note: reason }), "Booking cancelled").then(() => setProof(null)) })}>Cancel booking</Button>
        </>}>
        {proof && (
          <div className="flex flex-col gap-4">
            <Facts items={[["Amount", <strong key="a">{money(proof.total)}</strong>], ["UPI transaction ID", proof.utr || "—"], ["Phone", proof.phone || "—"], ["Event date", relDay(proof.starts_at)], ["Booked", ago(proof.created_at)], ["Status", <StatusPill key="s" status={proof.status} label={proof.status_label} />]]} />
            {proof.note && <p className="rounded-xl bg-background-secondary-default p-3 text-body-regular text-text-secondary">{proof.note}</p>}
            {proof.proof_url
              ? <a href={proof.proof_url} target="_blank" rel="noopener noreferrer">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={proof.proof_url} alt="Payment screenshot" className="w-full rounded-xl border border-border-button-default" /></a>
              : <p className="rounded-xl border border-dashed border-border-button-default p-6 text-center text-body-regular text-text-tertiary">The customer hasn't uploaded a payment screenshot yet.</p>}
          </div>
        )}
      </Drawer>
      {prompt && <PromptModal {...prompt} onClose={() => setPrompt(null)} />}
    </>
  );
}

function Kpi({ label, value, format, delta, hint }: Home["kpis"][number]) {
  const n = useCountUp(Number(value), 500);
  const up = delta != null && delta > 0;
  return (
    <div className="rounded-2xl border border-border-button-default bg-background-primary-default p-4 shadow-xs">
      <p className="text-body-regular text-text-secondary">{label}</p>
      <p className="mt-1 text-title-1-semibold tabular-nums text-text-primary">{format === "money" ? money(n) : Math.round(n).toLocaleString("en-IN")}</p>
      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-caption-1-medium text-text-tertiary">
        {delta != null && (
          <span className={cx("inline-flex items-center gap-0.5 rounded-md px-1 font-semibold", up ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400" : delta < 0 ? "bg-rose-500/12 text-rose-700 dark:text-rose-400" : "text-text-secondary")}>
            {up ? <RiArrowUpLine className="size-3" aria-hidden /> : delta < 0 ? <RiArrowDownLine className="size-3" aria-hidden /> : null}
            {Math.abs(delta)}%<span className="sr-only">{up ? " up" : " down"} on last month</span>
          </span>
        )}
        <span>{delta != null ? "vs last month · " : ""}{hint}</span>
      </p>
    </div>
  );
}

function TodoGroup({ icon: Icon, title, count, note, href, children }: { icon: typeof RiWallet3Line; title: string; count: number; note?: string; href: string; children: ReactNode }) {
  return (
    <div className="px-5 py-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="size-[18px] text-foreground-icon-secondary" aria-hidden />
        <h3 className="text-body-medium font-semibold text-text-primary">{title}</h3>
        <span className="rounded-full bg-accent-500 px-2 text-caption-1-medium font-semibold text-white">{count}</span>
        {note && <span className="hidden text-caption-1-medium text-text-tertiary sm:inline">· {note}</span>}
        <Link href={href} className="ms-auto flex items-center text-caption-1-medium text-text-secondary hover:text-text-primary">See all<RiArrowRightSLine className="size-4" aria-hidden /></Link>
      </div>
      <ul className="flex flex-col">{children}</ul>
    </div>
  );
}

function TodoRow({ lead, title, sub, amount, actions }: { lead: ReactNode; title: ReactNode; sub: ReactNode; amount?: ReactNode; actions?: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl py-2">
      {lead}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-medium text-text-primary">{title}</span>
        <span className="block truncate text-caption-1-medium text-text-tertiary">{sub}</span>
      </span>
      {amount && <span className="shrink-0 text-body-medium font-medium tabular-nums text-text-primary">{amount}</span>}
      {actions && <span className="flex shrink-0 gap-2">{actions}</span>}
    </li>
  );
}

/** Money received per day for 30 days. One series (trips + events); the tooltip splits it. */
function RevenueCard({ data, className }: { data: Home["revenue_30d"]; className?: string }) {
  const rows = useMemo(() => data.map((x) => ({ ...x, total: x.trips + x.events, label: new Date(x.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) })), [data]);
  const total = rows.reduce((a, r) => a + r.total, 0);
  const last7 = rows.slice(-7).reduce((a, r) => a + r.total, 0);
  return (
    <Card className={className} title="Money received" sub="Last 30 days, trips and events together"
      action={<div className="text-end"><p className="text-title-2-semibold tabular-nums text-text-primary">{money(total)}</p><p className="text-caption-1-medium text-text-tertiary">{money(last7)} in the last 7 days</p></div>}>
      <div className="h-[220px]" role="img" aria-label={`Money received per day over the last 30 days, ${money(total)} in total`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tickLine={false} axisLine={false} interval={6} tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }} />
            <YAxis tickLine={false} axisLine={false} width={48} tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
              tickFormatter={(v: number) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`)} />
            <Tooltip cursor={{ stroke: "var(--color-chart-cursor)", strokeWidth: 1 }} content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const r = payload[0].payload as (typeof rows)[number];
              return (
                <div className="rounded-xl border border-border-button-default bg-background-primary-default px-3 py-2 shadow-lg">
                  <p className="text-caption-1-medium text-text-tertiary">{r.label}</p>
                  <p className="text-body-medium font-semibold tabular-nums text-text-primary">{money(r.total)}</p>
                  <p className="text-caption-1-medium tabular-nums text-text-secondary">Trips {money(r.trips)} · Events {money(r.events)}</p>
                </div>
              );
            }} />
            <Area type="monotone" dataKey="total" stroke="var(--color-chart-1-active)" strokeWidth={2} fill="url(#rev-fill)"
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-background-primary-default)" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function SetupBanner({ items }: { items: Home["setup"] }) {
  const [open, setOpen] = useState(false);
  const warnings = (items || []).filter((i) => i.severity === "warning");
  if (!warnings.length) return null;
  return (
    <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/8 px-4 py-3">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 text-start" aria-expanded={open}>
        <RiAlertLine className="size-5 shrink-0 text-amber-600" aria-hidden />
        <span className="flex-1 text-body-medium text-text-primary">{warnings.length} setup item{warnings.length === 1 ? "" : "s"} still need attention before going fully live</span>
        <span className="text-caption-1-medium text-text-secondary">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <ul className="mt-2 flex flex-col gap-2 ps-7">
          {warnings.map((i) => (
            <li key={i.key} className="flex flex-wrap items-baseline gap-x-2 text-body-regular">
              <span className="text-text-primary">{i.title}</span><span className="text-text-secondary">{i.detail}</span>
              {i.href && <Link href={i.href} className="text-text-primary underline">Fix</Link>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-16 w-80 animate-pulse rounded-xl bg-background-secondary-default" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-background-secondary-default" />)}</div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3"><div className="h-80 animate-pulse rounded-2xl bg-background-secondary-default xl:col-span-2" /><div className="h-80 animate-pulse rounded-2xl bg-background-secondary-default" /></div>
    </div>
  );
}
