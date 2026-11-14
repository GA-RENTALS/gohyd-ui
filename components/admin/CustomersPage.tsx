"use client";
/**
 * Customers: everyone with an account, with filters (upcoming trip, balance due, repeat, blocked), sorting and export.
 * Data: GET /admin/lists/customers/ (admin_api/customers.py). Each row opens the customer's page.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { listQuery, useList, useQueryState } from "@/components/admin/hooks";
import {
  Card, type Column, DataTable, dateOnly, DateRangeFilter, Empty, ExportButton, FilterPills, money, PageTitle, Pager, Person, SearchBox, StatTile, StatusPill,
} from "@/components/admin/ui";
import { adminApi, type CustomerRow } from "@/lib/admin/api";

const BUCKETS = [
  { key: "upcoming", label: "Upcoming trip" },
  { key: "due", label: "Balance due" },
  { key: "repeat", label: "Repeat customers" },
  { key: "blocked", label: "Blocked" },
];
const SORTS = [
  { key: "joined", label: "Newest first" },
  { key: "spent", label: "Spent most" },
  { key: "bookings", label: "Most bookings" },
  { key: "name", label: "Name A–Z" },
];

export function CustomersPage() {
  const router = useRouter();
  const [f, setF] = useQueryState({ status: "all", sort: "joined", from: "", to: "" });
  const [search, setSearch] = useState("");
  const { data, loading, page, setPage, search: settledSearch } = useList(adminApi.customers, f, search);
  const counts = data?.counts ?? {};
  const summary = data?.summary;

  const columns: Column<CustomerRow>[] = [
    { key: "who", label: "Customer", render: (c) => <Person name={c.name} sub={c.email || c.phone} /> },
    { key: "phone", label: "Phone", render: (c) => <span className="text-text-secondary">{c.phone}</span>, hideOnMobile: true },
    { key: "trips", label: "Trips", align: "end", render: (c) => c.trip_bookings || <span className="text-text-tertiary">0</span> },
    { key: "events", label: "Events", align: "end", render: (c) => c.event_bookings || <span className="text-text-tertiary">0</span> },
    { key: "spent", label: "Spent", align: "end", render: (c) => Number(c.spent) > 0 ? <strong className="font-semibold">{money(c.spent)}</strong> : <span className="text-text-tertiary">—</span> },
    { key: "due", label: "Due", align: "end", render: (c) => Number(c.due) > 0 ? <span className="font-medium text-rose-600 dark:text-rose-400">{money(c.due)}</span> : <span className="text-text-tertiary">—</span> },
    { key: "joined", label: "Joined", render: (c) => (
      <span className="flex flex-wrap items-center gap-1.5 whitespace-nowrap text-text-secondary">
        {dateOnly(c.joined)}
        {!c.active && <StatusPill status="BLOCKED" tone="red" label="Blocked" />}
      </span>
    ) },
  ];

  return (
    <>
      <PageTitle title="Customers" sub="Everyone who has an account. Open one to see all their bookings, payments and notes."
        actions={<ExportButton onExport={() => adminApi.exportCsv("/admin/lists/customers/", listQuery(f, undefined, settledSearch), "customers.csv")} />} />

      {summary && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Customers" value={summary.total.toLocaleString("en-IN")} onClick={() => setF({ status: "all" })} />
          <StatTile label="New this month" value={summary.new_month} />
          <StatTile label="With a balance due" value={summary.with_due} tone={summary.with_due ? "red" : undefined} onClick={() => setF({ status: "due" })} />
          <StatTile label="Blocked" value={summary.blocked} onClick={() => setF({ status: "blocked" })} />
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <DateRangeFilter label="Joined" value={{ from: f.from, to: f.to }} onChange={(r) => setF(r)} />
        <label className="sr-only" htmlFor="customer-sort">Sort</label>
        <select id="customer-sort" value={f.sort} onChange={(e) => setF({ sort: e.target.value })}
          className="h-10 rounded-xl border border-border-button-default bg-background-primary-default px-3 text-body-medium text-text-primary outline-none focus:border-text-secondary">
          {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <div className="flex-1" />
        <SearchBox value={search} onChange={setSearch} placeholder="Name, phone or email…" />
      </div>

      <Card pad={false}>
        <div className="border-b border-separator-border p-3">
          <FilterPills value={f.status} onChange={(status) => setF({ status })}
            options={[{ key: "all", label: "All", count: counts.all }, ...BUCKETS.map((b) => ({ ...b, count: counts[b.key] }))]} />
        </div>
        <DataTable rows={data?.results ?? null} loading={loading} rowKey={(c) => c.id} columns={columns} onRowClick={(c) => router.push(`/admin/customer/${c.id}`)}
          empty={<Empty title={settledSearch ? `No customers match “${settledSearch}”` : "No customers here"} sub="Try another filter or date range." />} />
        {data && <Pager page={page} pages={data.pages} count={data.count} onChange={setPage} />}
      </Card>
    </>
  );
}
