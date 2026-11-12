"use client";
import { RiCheckLine, RiImageLine } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BookingDrawer } from "@/components/admin/BookingDrawer";
import { PromptModal } from "@/components/admin/ResourceView";
import { useAdmin } from "@/components/admin/Shell";
import {
  ago, Card, type Column, DataTable, dateOnly, Drawer, Empty, Facts, FilterPills, money, nice, PageTitle, Pager, Person, relDay, SearchBox, StatusPill,
} from "@/components/admin/ui";
import { Button } from "@/components/base/buttons/button";
import { toast } from "@/components/base/toast/toast";
import { adminApi, type BookingRow, type CustomerRow, type ListPage } from "@/lib/admin/api";

/** URL ?type=…&status=… so dashboard links and the back button land on the same view. */
function useQueryState(defaults: Record<string, string>) {
  const router = useRouter();
  const [state, setState] = useState(defaults);
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    setState((s) => Object.fromEntries(Object.keys(s).map((k) => [k, qs.get(k) ?? s[k]])));
  }, []);
  const set = (patch: Record<string, string>) => setState((s) => {
    const next = { ...s, ...patch };
    const qs = new URLSearchParams(Object.entries(next).filter(([k, v]) => v && v !== defaults[k]));
    router.replace(`${window.location.pathname}${qs.toString() ? `?${qs}` : ""}`, { scroll: false });
    return next;
  });
  return [state, set] as const;
}

/** Fetch a list page whenever the filters change; search waits for typing to pause. */
function useList<T>(fetcher: (qs: URLSearchParams) => Promise<ListPage<T>>, params: Record<string, string>, search: string) {
  const [data, setData] = useState<ListPage<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState(search);
  useEffect(() => { const t = setTimeout(() => setQ(search), 300); return () => clearTimeout(t); }, [search]);
  const key = JSON.stringify(params);
  useEffect(() => setPage(1), [key, q]);
  const load = useCallback(() => {
    const qs = new URLSearchParams({ ...params, page: String(page) });
    if (q) qs.set("search", q);
    setLoading(true);
    fetcher(qs).then(setData).catch((e) => toast(e.message, { status: "error" })).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, page, q]);
  useEffect(load, [load]);
  return { data, loading, page, setPage, reload: load };
}

const TypeSwitch = ({ value, onChange, a, b }: { value: string; onChange: (v: string) => void; a: string; b: string }) => (
  <FilterPills value={value} onChange={onChange} options={[{ key: "trip", label: a }, { key: "event", label: b }]} />
);

/* ================= Bookings ================= */

export function BookingsPage() {
  const [f, setF] = useQueryState({ type: "trip", status: "all" });
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<BookingRow | null>(null);
  const { data, loading, page, setPage, reload } = useList(adminApi.bookings, { type: f.type, status: f.status }, search);
  const c = data?.counts ?? {};
  const isTrip = f.type === "trip";

  const columns: Column<BookingRow>[] = [
    { key: "who", label: "Customer", render: (r) => <Person name={r.name} sub={r.phone} /> },
    { key: "what", label: isTrip ? "Trip" : "Event", render: (r) => <span className="block max-w-[260px]"><span className="block truncate">{r.title}</span><span className="block text-caption-1-medium text-text-tertiary">{relDay(r.starts_at)}</span></span> },
    { key: "people", label: "People", render: (r) => r.people, align: "end" },
    { key: "total", label: "Total", render: (r) => money(r.total), align: "end" },
    { key: "due", label: "Due", align: "end", render: (r) => Number(r.due) > 0 ? <span className="font-medium text-rose-600 dark:text-rose-400">{money(r.due)}</span> : <span className="text-text-tertiary">—</span> },
    { key: "status", label: "Status", render: (r) => <span className="flex flex-wrap items-center gap-1.5"><StatusPill status={r.status} label={r.status_label} />{r.proof_url && r.status === "PENDING" && <StatusPill status="info" tone="blue" label="Proof sent" />}</span> },
    { key: "when", label: "Booked", render: (r) => <span className="whitespace-nowrap text-text-secondary">{ago(r.created_at)}</span>, hideOnMobile: true },
  ];

  return (
    <>
      <PageTitle title="Bookings" sub="Every trip and event booking. Click one to see it and take action." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <TypeSwitch value={f.type} onChange={(type) => setF({ type, status: "all" })} a="Trip bookings" b="Event bookings" />
        <div className="flex-1" />
        <SearchBox value={search} onChange={setSearch} placeholder="Name, phone, reference, trip…" />
      </div>
      <Card pad={false}>
        <div className="border-b border-separator-border p-3">
          <FilterPills value={f.status} onChange={(status) => setF({ status })} options={[
            { key: "all", label: "All", count: c.all }, { key: "awaiting", label: "Awaiting payment", count: c.awaiting },
            { key: "paid", label: isTrip ? "Fully paid" : "Confirmed", count: c.paid }, { key: "cancelled", label: "Cancelled", count: c.cancelled },
          ]} />
        </div>
        <DataTable rows={data?.results ?? null} loading={loading} rowKey={(r) => r.id} columns={columns} onRowClick={setOpen}
          empty={<Empty title={search ? `No bookings match “${search}”` : "No bookings here"} sub="Try another filter or search." />} />
        {data && <Pager page={page} pages={data.pages} count={data.count} onChange={setPage} />}
      </Card>
      <BookingDrawer row={open} onClose={() => setOpen(null)} onChanged={reload} can={data?.can ?? {}} />
    </>
  );
}

/* ================= Payments ================= */

type TripPayment = { id: string; amount: string; status: string; kind: string; method: string; reference: string; name: string; phone: string; customer_id: string; bookings: string[]; title: string; parent_id: string | null; failure_reason: string; created_at: string };

export function PaymentsPage() {
  const { refreshCounts } = useAdmin();
  const [f, setF] = useQueryState({ type: "trip", status: "all" });
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState("");
  const [openPay, setOpenPay] = useState<TripPayment | null>(null);
  const [openReg, setOpenReg] = useState<BookingRow | null>(null);
  const [prompt, setPrompt] = useState<{ title: string; label: string; run: (t: string) => Promise<void> } | null>(null);
  const { data, loading, page, setPage, reload } = useList(adminApi.payments, { type: f.type, status: f.status }, search);
  const c = data?.counts ?? {};
  const isTrip = f.type === "trip";

  async function act(key: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(key);
    try { await fn(); toast(ok, { status: "success" }); reload(); refreshCounts(); setOpenPay(null); }
    catch (e: any) { toast(e.message || "Something went wrong", { status: "error" }); throw e; }
    finally { setBusy(""); }
  }
  const verify = (p: TripPayment) => act(p.id, () => adminApi.action("verify-payment", { payment_id: p.id, approved: true }), "Payment verified").catch(() => {});
  const reject = (p: TripPayment) => setPrompt({ title: "Reject payment", label: "Why is it rejected?", run: (note) => act(p.id, () => adminApi.action("verify-payment", { payment_id: p.id, approved: false, note }), "Payment rejected") });

  const tripCols: Column<TripPayment>[] = [
    { key: "who", label: "Paid by", render: (p) => <Person name={p.name} sub={p.phone} /> },
    { key: "amount", label: "Amount", align: "end", render: (p) => <strong className="font-semibold">{money(p.amount, 2)}</strong> },
    { key: "for", label: "For", render: (p) => <span className="block max-w-[240px]"><span className="block truncate">{p.title || "—"}</span><span className="block truncate text-caption-1-medium text-text-tertiary">{p.bookings.join(", ")}</span></span> },
    { key: "how", label: "How", render: (p) => <span className="text-text-secondary">{p.method === "MANUAL" ? "Cash / bank" : "Online"} · {nice(p.kind)}</span> },
    { key: "status", label: "Status", render: (p) => <StatusPill status={p.status} label={p.status === "PENDING_VERIFICATION" ? "To verify" : p.status === "SUCCEEDED" ? "Received" : nice(p.status)} /> },
    { key: "when", label: "Date", render: (p) => <span className="whitespace-nowrap text-text-secondary">{ago(p.created_at)}</span>, hideOnMobile: true },
  ];
  const eventCols: Column<BookingRow>[] = [
    { key: "proof", label: "Screenshot", render: (r) => (
      <span className="flex items-center gap-3">
        <span className="grid h-12 w-10 shrink-0 place-items-center overflow-hidden rounded-md border border-border-button-default bg-background-secondary-default">
          {r.proof_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={r.proof_url} alt="" className="size-full object-cover" /> : <RiImageLine className="size-4 text-foreground-icon-tertiary" aria-hidden />}
        </span>
        <Person name={r.name} sub={r.phone} />
      </span>
    ) },
    { key: "amount", label: "Amount", align: "end", render: (r) => <strong className="font-semibold">{money(r.total)}</strong> },
    { key: "event", label: "Event", render: (r) => <span className="block max-w-[220px]"><span className="block truncate">{r.title}</span><span className="block text-caption-1-medium text-text-tertiary">{r.reference} · {r.people} {r.people === 1 ? "person" : "people"}</span></span> },
    { key: "utr", label: "UPI ref", render: (r) => <span className="font-mono text-caption-1-medium">{r.utr || "—"}</span> },
    { key: "status", label: "Status", render: (r) => <StatusPill status={r.status} label={r.status === "PENDING" ? "To confirm" : r.status_label} /> },
  ];

  return (
    <>
      <PageTitle title="Payments" sub="Money received, and payments waiting for someone to check them." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <TypeSwitch value={f.type} onChange={(type) => setF({ type, status: "all" })} a="Trip payments" b="Event UPI payments" />
        <div className="flex-1" />
        <SearchBox value={search} onChange={setSearch} placeholder={isTrip ? "Name, phone, reference…" : "Name, phone, UPI ref…"} />
      </div>
      <Card pad={false}>
        <div className="border-b border-separator-border p-3">
          <FilterPills value={f.status} onChange={(status) => setF({ status })} options={[
            { key: "all", label: "All", count: c.all }, { key: "pending", label: isTrip ? "To verify" : "To confirm", count: c.pending },
            { key: "succeeded", label: isTrip ? "Received" : "Confirmed", count: c.succeeded }, { key: "failed", label: isTrip ? "Failed / rejected" : "Cancelled", count: c.failed },
          ]} />
        </div>
        {isTrip ? (
          <DataTable rows={(data?.results as TripPayment[]) ?? null} loading={loading} rowKey={(p) => p.id} columns={tripCols} onRowClick={setOpenPay}
            actions={(p) => p.status === "PENDING_VERIFICATION" && data?.can?.verify ? <>
              <Button size="small" variant="secondary" onClick={() => reject(p)}>Reject</Button>
              <Button size="small" variant="primary" leadingIcon={RiCheckLine} disabled={busy === p.id} onClick={() => verify(p)}>Verify</Button>
            </> : null}
            empty={<Empty title="No payments here" sub="Online payments and recorded cash / bank transfers appear here." />} />
        ) : (
          <DataTable rows={(data?.results as BookingRow[]) ?? null} loading={loading} rowKey={(r) => r.id} columns={eventCols} onRowClick={setOpenReg}
            actions={(r) => r.status === "PENDING" && data?.can?.confirm ? (
              <Button size="small" variant="primary" leadingIcon={RiCheckLine} disabled={busy === r.id}
                onClick={() => act(r.id, () => adminApi.update("event-registrations", r.id, { status: "CONFIRMED" }), `${r.name}'s booking confirmed`).catch(() => {})}>Confirm</Button>
            ) : null}
            empty={<Empty title="No event payments here" sub="When customers upload a UPI screenshot, it shows up here to check." />} />
        )}
        {data && <Pager page={page} pages={data.pages} count={data.count} onChange={setPage} />}
      </Card>

      <Drawer open={!!openPay} onClose={() => setOpenPay(null)} title={openPay ? money(openPay.amount, 2) : ""} sub={openPay?.name}
        footer={openPay?.status === "PENDING_VERIFICATION" && data?.can?.verify && <>
          <Button variant="primary" leadingIcon={RiCheckLine} disabled={busy === openPay.id} onClick={() => verify(openPay)}>Verify payment</Button>
          <Button variant="secondary" onClick={() => reject(openPay)}>Reject</Button>
        </>}>
        {openPay && (
          <div className="flex flex-col gap-4">
            <StatusPill status={openPay.status} label={openPay.status === "PENDING_VERIFICATION" ? "Waiting for a second staff member to verify" : nice(openPay.status)} />
            <Facts items={[["Trip", openPay.title || "—"], ["Bookings", openPay.bookings.join(", ") || "—"], ["Method", openPay.method === "MANUAL" ? "Cash / bank transfer" : "Online (Razorpay)"],
              ["Type", nice(openPay.kind)], ["Reference", openPay.reference || "—"], ["Date", dateOnly(openPay.created_at)], ["Phone", openPay.phone],
              ...(openPay.failure_reason ? [["Reason", openPay.failure_reason] as [string, string]] : [])]} />
            <div className="flex flex-wrap gap-2">
              {openPay.parent_id && <Button size="small" variant="secondary" onClick={() => window.location.assign(`/admin/overview/trip/${openPay.parent_id}?tab=payments`)}>Open trip</Button>}
              <Button size="small" variant="secondary" onClick={() => window.location.assign(`/admin/customer/${openPay.customer_id}`)}>Open customer</Button>
            </div>
          </div>
        )}
      </Drawer>
      <BookingDrawer row={openReg} onClose={() => setOpenReg(null)} onChanged={reload} can={{ confirm: data?.can?.confirm, cancel: data?.can?.confirm }} />
      {prompt && <PromptModal {...prompt} onClose={() => setPrompt(null)} />}
    </>
  );
}

/* ================= Customers ================= */

export function CustomersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { data, loading, page, setPage } = useList(adminApi.customers, {}, search);
  const columns: Column<CustomerRow>[] = [
    { key: "who", label: "Customer", render: (c) => <Person name={c.name} sub={c.email || c.phone} /> },
    { key: "phone", label: "Phone", render: (c) => <span className="text-text-secondary">{c.phone}</span>, hideOnMobile: true },
    { key: "trips", label: "Trips", align: "end", render: (c) => c.trip_bookings || <span className="text-text-tertiary">0</span> },
    { key: "events", label: "Events", align: "end", render: (c) => c.event_bookings || <span className="text-text-tertiary">0</span> },
    { key: "spent", label: "Spent", align: "end", render: (c) => Number(c.spent) > 0 ? <strong className="font-semibold">{money(c.spent)}</strong> : <span className="text-text-tertiary">—</span> },
    { key: "joined", label: "Joined", render: (c) => <span className="whitespace-nowrap text-text-secondary">{dateOnly(c.joined)}</span> },
  ];
  return (
    <>
      <PageTitle title="Customers" sub="Everyone who has an account. Open one to see all their bookings and payments." />
      <div className="mb-4 flex justify-end"><SearchBox value={search} onChange={setSearch} placeholder="Name, phone or email…" /></div>
      <Card pad={false}>
        <DataTable rows={data?.results ?? null} loading={loading} rowKey={(c) => c.id} columns={columns} onRowClick={(c) => router.push(`/admin/customer/${c.id}`)}
          empty={<Empty title={search ? `No customers match “${search}”` : "No customers yet"} />} />
        {data && <Pager page={page} pages={data.pages} count={data.count} onChange={setPage} />}
      </Card>
    </>
  );
}
