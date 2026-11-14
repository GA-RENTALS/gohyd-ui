"use client";
/** Bookings: every trip and event booking, with status filters and a drawer to act on one. */
import { useState } from "react";
import { BookingDrawer } from "@/components/admin/BookingDrawer";
import { useList, useQueryState } from "@/components/admin/hooks";
import {
  ago, Card, type Column, DataTable, Empty, FilterPills, money, PageTitle, Pager, Person, relDay, SearchBox, StatusPill,
} from "@/components/admin/ui";
import { adminApi, type BookingRow } from "@/lib/admin/api";

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
