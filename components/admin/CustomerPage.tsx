"use client";
import { RiEditLine, RiMailLine, RiPhoneLine, RiWhatsappLine } from "@remixicon/react";
import { useCallback, useEffect, useState } from "react";
import { BookingDrawer } from "@/components/admin/BookingDrawer";
import { schemaOf } from "@/components/admin/RelatedList";
import { RecordForm } from "@/components/admin/ResourceView";
import { PageHeader, useAdmin } from "@/components/admin/Shell";
import { ago, Card, type Column, DataTable, dateOnly, Empty, FilterPills, Initials, money, nice, relDay, StatusPill } from "@/components/admin/ui";
import { Button } from "@/components/base/buttons/button";
import { toast } from "@/components/base/toast/toast";
import { adminApi, type BookingRow, type CustomerPage as Data, type Schema } from "@/lib/admin/api";

/** One customer: contact details, totals, and every trip booking, event booking, payment and enquiry. */
export function CustomerPage({ id }: { id: string }) {
  const perms = new Set(useAdmin().session.permissions);
  const can = {
    cancel: perms.has("bookings.change_booking") || perms.has("trips.change_eventregistration"),
    confirm: perms.has("trips.change_eventregistration"),
    record_payment: perms.has("payments.add_payment"),
  };
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<"bookings" | "payments" | "enquiries">("bookings");
  const [open, setOpen] = useState<BookingRow | null>(null);
  const [editing, setEditing] = useState<{ schema: Schema; row: any } | null>(null);
  const load = useCallback(() => { adminApi.customer(id).then(setD).catch((e) => setErr(e.message)); }, [id]);
  useEffect(load, [load]);

  if (err) return <Empty title="Couldn't open this customer" sub={err} action={<Button variant="secondary" onClick={load}>Try again</Button>} />;
  if (!d) return <div className="flex flex-col gap-4"><div className="h-28 animate-pulse rounded-2xl bg-background-secondary-default" /><div className="h-80 animate-pulse rounded-2xl bg-background-secondary-default" /></div>;

  const bookings = [...d.trip_bookings, ...d.event_bookings].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const wa = d.phone.replace(/[^\d]/g, "");
  const cols: Column<BookingRow>[] = [
    { key: "what", label: "Booking", render: (r) => <span className="block max-w-[280px]"><span className="block truncate">{r.title}</span><span className="block text-caption-1-medium text-text-tertiary">{r.type === "trip" ? "Trip" : "Event"} · {r.reference}</span></span> },
    { key: "date", label: "Date", render: (r) => <span className="whitespace-nowrap text-text-secondary">{relDay(r.starts_at)}</span> },
    { key: "people", label: "People", align: "end", render: (r) => r.people },
    { key: "total", label: "Total", align: "end", render: (r) => money(r.total) },
    { key: "due", label: "Due", align: "end", render: (r) => Number(r.due) > 0 ? <span className="font-medium text-rose-600 dark:text-rose-400">{money(r.due)}</span> : <span className="text-text-tertiary">—</span> },
    { key: "status", label: "Status", render: (r) => <StatusPill status={r.status} label={r.status_label} /> },
  ];

  return (
    <>
      <PageHeader crumbs={[{ label: "Customers", href: "/admin/customers" }, d.name]} title=""
        actions={d.can_edit && <Button variant="secondary" leadingIcon={RiEditLine} onClick={() => Promise.all([schemaOf("customers"), adminApi.get("customers", d.id)]).then(([schema, row]) => setEditing({ schema, row })).catch((e) => toast(e.message, { status: "error" }))}>Edit</Button>} />

      <section className="-mt-4 mb-6 flex flex-wrap items-center gap-4">
        <Initials name={d.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-title-1-semibold tracking-tight text-text-primary">{d.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-regular text-text-secondary">
            <a href={`tel:${d.phone}`} className="inline-flex items-center gap-1 hover:text-text-primary"><RiPhoneLine className="size-4" aria-hidden />{d.phone}</a>
            {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-text-primary"><RiWhatsappLine className="size-4" aria-hidden />WhatsApp</a>}
            {d.email && <a href={`mailto:${d.email}`} className="inline-flex items-center gap-1 hover:text-text-primary"><RiMailLine className="size-4" aria-hidden />{d.email}</a>}
            <span>Customer since {dateOnly(d.joined)}</span>
            {!d.active && <StatusPill status="BLOCKED" tone="red" label="Inactive" />}
          </p>
        </div>
      </section>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[["Trip bookings", d.stats.trip_bookings], ["Event bookings", d.stats.event_bookings], ["Total paid", money(d.stats.spent)], ["Still due", money(d.stats.due)]].map(([k, v]) => (
          <div key={k as string} className="rounded-2xl border border-border-button-default bg-background-primary-default p-4 shadow-xs">
            <p className="text-body-regular text-text-secondary">{k}</p>
            <p className={`mt-1 text-title-2-semibold tabular-nums ${k === "Still due" && Number(d.stats.due) > 0 ? "text-rose-600 dark:text-rose-400" : "text-text-primary"}`}>{v}</p>
          </div>
        ))}
      </div>

      <div className="mb-3"><FilterPills value={tab} onChange={setTab} options={[
        { key: "bookings", label: "Bookings", count: bookings.length }, { key: "payments", label: "Payments", count: d.payments.length }, { key: "enquiries", label: "Enquiries", count: d.enquiries.length },
      ]} /></div>

      <Card pad={false}>
        {tab === "bookings" && <DataTable rows={bookings} rowKey={(r) => `${r.type}-${r.id}`} columns={cols} onRowClick={setOpen} empty={<Empty title="No bookings yet" />} />}
        {tab === "payments" && <DataTable rows={d.payments} rowKey={(p) => p.id} empty={<Empty title="No payments yet" />} columns={[
          { key: "amount", label: "Amount", render: (p) => <strong className="font-semibold">{money(p.amount, 2)}</strong> },
          { key: "how", label: "How", render: (p) => <span className="text-text-secondary">{p.method === "MANUAL" ? "Cash / bank" : "Online"} · {nice(p.kind)}</span> },
          { key: "ref", label: "Reference", render: (p) => p.reference || "—" },
          { key: "status", label: "Status", render: (p) => <StatusPill status={p.status} label={p.status === "PENDING_VERIFICATION" ? "To verify" : p.status === "SUCCEEDED" ? "Received" : undefined} /> },
          { key: "when", label: "Date", render: (p) => <span className="text-text-secondary">{dateOnly(p.created_at)}</span> },
        ]} />}
        {tab === "enquiries" && <DataTable rows={d.enquiries} rowKey={(e) => e.id} empty={<Empty title="No enquiries from this number" />} columns={[
          { key: "msg", label: "Message", render: (e) => <span className="line-clamp-2 max-w-xl">{e.message || "—"}</span> },
          { key: "status", label: "Status", render: (e) => <StatusPill status={e.status} /> },
          { key: "when", label: "Received", render: (e) => <span className="whitespace-nowrap text-text-secondary">{ago(e.created_at)}</span> },
        ]} />}
      </Card>

      <BookingDrawer row={open} onClose={() => setOpen(null)} onChanged={load} can={can} />
      {editing && <RecordForm schema={editing.schema} row={editing.row} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); toast("Saved", { status: "success" }); load(); }} />}
    </>
  );
}
