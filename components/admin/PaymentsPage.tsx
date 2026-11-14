"use client";
/**
 * Payments: trip payments (online + cash/bank), event UPI proofs, trip refunds and event refunds (sent back by UPI),
 * with a money summary, date filter and export.
 * Data: GET /admin/lists/payments/ (admin_api/payments.py).
 */
import { RiAlertLine, RiCheckLine, RiImageLine } from "@remixicon/react";
import { useState } from "react";
import { BookingDrawer } from "@/components/admin/BookingDrawer";
import { FormModal, useFormSubmit } from "@/components/admin/FormModal";
import { listQuery, useAction, useList, useQueryState } from "@/components/admin/hooks";
import { PromptModal } from "@/components/admin/ResourceView";
import { useAdmin } from "@/components/admin/Shell";
import {
  ago, Card, type Column, DataTable, dateOnly, DateRangeFilter, Drawer, Empty, ExportButton, Facts, FilterPills, money, nice, PageTitle,
  Pager, Person, SearchBox, StatTile, StatusPill,
} from "@/components/admin/ui";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { adminApi, type BookingRow, type EventRefundRow, type PaymentSummary, type RefundRow, type TripPayment } from "@/lib/admin/api";

type Kind = "trip" | "event" | "refund" | "event_refund";
type Prompt = { title: string; label: string; run: (text: string) => Promise<void> };

const STATUS_TABS: Record<Kind, { key: string; label: string }[]> = {
  trip: [{ key: "pending", label: "To verify" }, { key: "succeeded", label: "Received" }, { key: "failed", label: "Failed / rejected" }],
  event: [{ key: "pending", label: "To confirm" }, { key: "succeeded", label: "Confirmed" }, { key: "failed", label: "Cancelled" }],
  refund: [{ key: "pending", label: "To approve" }, { key: "processing", label: "Processing" }, { key: "processed", label: "Refunded" }, { key: "failed", label: "Failed / rejected" }],
  event_refund: [{ key: "due", label: "To send" }, { key: "sent", label: "Sent" }, { key: "not_refunded", label: "Not refunded" }],
};
const SEARCH_HINT: Record<Kind, string> = {
  trip: "Name, phone, reference…", event: "Name, phone, UPI ref…", refund: "Name, phone, booking…", event_refund: "Name, phone, booking, UPI ref…",
};

export function PaymentsPage() {
  const { refreshCounts } = useAdmin();
  const [f, setF] = useQueryState({ type: "trip", status: "all", from: "", to: "" });
  const [search, setSearch] = useState("");
  const [openPayment, setOpenPayment] = useState<TripPayment | null>(null);
  const [openBooking, setOpenBooking] = useState<BookingRow | null>(null);
  const [openRefund, setOpenRefund] = useState<RefundRow | null>(null);
  const [openEventRefund, setOpenEventRefund] = useState<EventRefundRow | null>(null);
  const [recording, setRecording] = useState<EventRefundRow | null>(null);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const { data, loading, page, setPage, reload, search: settledSearch } = useList(adminApi.payments, f, search);
  const { busy, run } = useAction(() => { reload(); refreshCounts(); setOpenPayment(null); setOpenRefund(null); });

  const kind = f.type as Kind;
  const can = data?.can ?? {};
  const counts = data?.counts ?? {};
  const switchTo = (type: Kind, status = "all") => setF({ type, status });

  const verify = (p: TripPayment) => run(p.id, () => adminApi.action("verify-payment", { payment_id: p.id, approved: true }), "Payment verified").catch(() => {});
  const reject = (p: TripPayment) => setPrompt({
    title: "Reject payment", label: "Why is it rejected?",
    run: (note) => run(p.id, () => adminApi.action("verify-payment", { payment_id: p.id, approved: false, note }), "Payment rejected"),
  });
  const confirm = (r: BookingRow) => run(r.id, () => adminApi.update("event-registrations", r.id, { status: "CONFIRMED" }), `${r.name}'s booking confirmed`).catch(() => {});
  const approve = (r: RefundRow) => run(r.id, () => adminApi.action("approve-refund", { refund_id: r.id }), "Refund approved").catch(() => {});

  const typeTabs: { key: Kind; label: string }[] = [
    { key: "trip", label: "Trip payments" },
    ...(can.events !== false ? [{ key: "event" as const, label: "Event UPI payments" }] : []),
    ...(can.refunds !== false ? [{ key: "refund" as const, label: "Trip refunds" }] : []),
    ...(can.event_refunds ? [{ key: "event_refund" as const, label: "Event refunds" }] : []),
  ];
  const recorded = () => { setRecording(null); setOpenEventRefund(null); reload(); refreshCounts(); };

  return (
    <>
      <PageTitle title="Payments" sub="Money received, payments waiting for a check, and refunds."
        actions={<ExportButton onExport={() => adminApi.exportCsv("/admin/lists/payments/", listQuery(f, undefined, settledSearch), `${kind}-payments.csv`)} />} />

      {data?.summary && <SummaryStrip summary={data.summary} onOpen={switchTo} />}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <FilterPills value={kind} onChange={(type) => switchTo(type)} options={typeTabs} />
        <DateRangeFilter value={{ from: f.from, to: f.to }} onChange={(r) => setF(r)} />
        <div className="flex-1" />
        <SearchBox value={search} onChange={setSearch} placeholder={SEARCH_HINT[kind]} />
      </div>

      <Card pad={false}>
        <div className="border-b border-separator-border p-3">
          <FilterPills value={f.status} onChange={(status) => setF({ status })}
            options={[{ key: "all", label: "All", count: counts.all }, ...STATUS_TABS[kind].map((t) => ({ ...t, count: counts[t.key] }))]} />
        </div>
        {kind === "trip" && (
          <TripPaymentsTable rows={data ? (data.results as TripPayment[]) : null} loading={loading} canVerify={!!can.verify} busy={busy}
            onOpen={setOpenPayment} onVerify={verify} onReject={reject} />
        )}
        {kind === "event" && (
          <EventProofsTable rows={data ? (data.results as BookingRow[]) : null} loading={loading} canConfirm={!!can.confirm} busy={busy}
            onOpen={setOpenBooking} onConfirm={confirm} />
        )}
        {kind === "refund" && (
          <RefundsTable rows={data ? (data.results as RefundRow[]) : null} loading={loading} canApprove={!!can.approve_refund} busy={busy}
            onOpen={setOpenRefund} onApprove={approve} />
        )}
        {kind === "event_refund" && (
          <EventRefundsTable rows={data ? (data.results as EventRefundRow[]) : null} loading={loading} canRecord={!!can.record_event_refund}
            onOpen={setOpenEventRefund} onRecord={setRecording} />
        )}
        {data && <Pager page={page} pages={data.pages} count={data.count} onChange={setPage} />}
      </Card>

      <PaymentDrawer payment={openPayment} canVerify={!!can.verify} busy={busy} onClose={() => setOpenPayment(null)} onVerify={verify} onReject={reject} />
      <RefundDrawer refund={openRefund} canApprove={!!can.approve_refund} busy={busy} onClose={() => setOpenRefund(null)} onApprove={approve} />
      <EventRefundDrawer refund={openEventRefund} canRecord={!!can.record_event_refund} onClose={() => setOpenEventRefund(null)} onRecord={setRecording} />
      {recording && <RecordRefundForm refund={recording} onClose={() => setRecording(null)} onSaved={recorded} />}
      <BookingDrawer row={openBooking} onClose={() => setOpenBooking(null)} onChanged={reload} can={{ confirm: can.confirm, cancel: can.confirm }} />
      {prompt && <PromptModal {...prompt} onClose={() => setPrompt(null)} />}
    </>
  );
}

/* ---------- summary ---------- */

function SummaryStrip({ summary, onOpen }: { summary: PaymentSummary; onOpen: (type: Kind, status?: string) => void }) {
  const { received_month: received, to_verify: verify, refunds_waiting: refunds, event_refunds_due: eventRefunds, balance_due: due } = summary;
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {received && <StatTile label="Received this month" value={money(received.amount)} sub="Trip payments + confirmed event bookings" />}
      {verify && (
        <StatTile label="Waiting for a check" value={verify.count} tone={verify.count ? "amber" : undefined}
          sub={verify.count ? `${money(verify.amount)} to verify or confirm` : "Nothing waiting"} onClick={() => onOpen("trip", "pending")} />
      )}
      {refunds && (
        <StatTile label="Refunds to approve" value={refunds.count} tone={refunds.count ? "amber" : undefined}
          sub={refunds.count ? money(refunds.amount) : "Nothing waiting"} onClick={() => onOpen("refund", "pending")} />
      )}
      {eventRefunds && eventRefunds.count > 0 && (
        <StatTile label="Event refunds to send" value={eventRefunds.count} tone="amber"
          sub={`${money(eventRefunds.amount)} to send by UPI`} onClick={() => onOpen("event_refund", "due")} />
      )}
      {due && <StatTile label="Balances due" value={money(due.amount)} tone={Number(due.amount) > 0 ? "red" : undefined} sub={`Across ${due.count} open trip ${due.count === 1 ? "booking" : "bookings"}`} />}
    </div>
  );
}

/* ---------- tables ---------- */

function TripPaymentsTable({ rows, loading, canVerify, busy, onOpen, onVerify, onReject }: {
  rows: TripPayment[] | null; loading: boolean; canVerify: boolean; busy: string;
  onOpen: (p: TripPayment) => void; onVerify: (p: TripPayment) => void; onReject: (p: TripPayment) => void;
}) {
  const columns: Column<TripPayment>[] = [
    { key: "who", label: "Paid by", render: (p) => <Person name={p.name} sub={p.phone} /> },
    { key: "amount", label: "Amount", align: "end", render: (p) => <strong className="font-semibold">{money(p.amount, 2)}</strong> },
    { key: "for", label: "For", render: (p) => <Stacked main={p.title || "—"} sub={p.bookings.join(", ")} /> },
    { key: "how", label: "How", render: (p) => <span className="text-text-secondary">{p.method === "MANUAL" ? "Cash / bank" : "Online"} · {nice(p.kind)}</span> },
    { key: "status", label: "Status", render: (p) => <StatusPill status={p.status} label={tripStatusLabel(p.status)} /> },
    { key: "when", label: "Date", render: (p) => <span className="whitespace-nowrap text-text-secondary">{ago(p.created_at)}</span>, hideOnMobile: true },
  ];
  return (
    <DataTable rows={rows} loading={loading} rowKey={(p) => p.id} columns={columns} onRowClick={onOpen}
      actions={(p) => p.status === "PENDING_VERIFICATION" && canVerify ? <>
        <Button size="small" variant="secondary" onClick={() => onReject(p)}>Reject</Button>
        <Button size="small" variant="primary" leadingIcon={RiCheckLine} disabled={busy === p.id} onClick={() => onVerify(p)}>Verify</Button>
      </> : null}
      empty={<Empty title="No payments here" sub="Online payments and recorded cash / bank transfers appear here." />} />
  );
}

function EventProofsTable({ rows, loading, canConfirm, busy, onOpen, onConfirm }: {
  rows: BookingRow[] | null; loading: boolean; canConfirm: boolean; busy: string; onOpen: (r: BookingRow) => void; onConfirm: (r: BookingRow) => void;
}) {
  const columns: Column<BookingRow>[] = [
    { key: "proof", label: "Screenshot", render: (r) => (
      <span className="flex items-center gap-3">
        <span className="grid h-12 w-10 shrink-0 place-items-center overflow-hidden rounded-md border border-border-button-default bg-background-secondary-default">
          {r.proof_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={r.proof_url} alt="" className="size-full object-cover" /> : <RiImageLine className="size-4 text-foreground-icon-tertiary" aria-hidden />}
        </span>
        <Person name={r.name} sub={r.phone} />
      </span>
    ) },
    { key: "amount", label: "Amount", align: "end", render: (r) => <strong className="font-semibold">{money(r.total)}</strong> },
    { key: "event", label: "Event", render: (r) => <Stacked main={r.title} sub={`${r.reference} · ${r.people} ${r.people === 1 ? "person" : "people"}`} /> },
    { key: "utr", label: "UPI ref", render: (r) => <UtrCell utr={r.utr} duplicate={r.utr_duplicate} /> },
    { key: "status", label: "Status", render: (r) => <StatusPill status={r.status} label={r.status === "PENDING" ? "To confirm" : r.status_label} /> },
  ];
  return (
    <DataTable rows={rows} loading={loading} rowKey={(r) => r.id} columns={columns} onRowClick={onOpen}
      actions={(r) => r.status === "PENDING" && canConfirm ? (
        <Button size="small" variant="primary" leadingIcon={RiCheckLine} disabled={busy === r.id} onClick={() => onConfirm(r)}>Confirm</Button>
      ) : null}
      empty={<Empty title="No event payments here" sub="When customers upload a UPI screenshot, it shows up here to check." />} />
  );
}

function RefundsTable({ rows, loading, canApprove, busy, onOpen, onApprove }: {
  rows: RefundRow[] | null; loading: boolean; canApprove: boolean; busy: string; onOpen: (r: RefundRow) => void; onApprove: (r: RefundRow) => void;
}) {
  const columns: Column<RefundRow>[] = [
    { key: "who", label: "Customer", render: (r) => <Person name={r.name} sub={r.phone} /> },
    { key: "amount", label: "Amount", align: "end", render: (r) => <strong className="font-semibold">{money(r.amount, 2)}</strong> },
    { key: "for", label: "For", render: (r) => <Stacked main={r.title || "—"} sub={r.booking} /> },
    { key: "reason", label: "Reason", render: (r) => <span className="line-clamp-2 max-w-[240px] text-text-secondary">{r.reason || "—"}</span>, hideOnMobile: true },
    { key: "status", label: "Status", render: (r) => <StatusPill status={r.status} label={refundStatusLabel(r.status)} /> },
    { key: "when", label: "Requested", render: (r) => <span className="whitespace-nowrap text-text-secondary">{ago(r.created_at)}</span>, hideOnMobile: true },
  ];
  return (
    <DataTable rows={rows} loading={loading} rowKey={(r) => r.id} columns={columns} onRowClick={onOpen}
      actions={(r) => r.status === "REQUESTED" && canApprove ? (
        <Button size="small" variant="primary" leadingIcon={RiCheckLine} disabled={busy === r.id} onClick={() => onApprove(r)}>Approve</Button>
      ) : null}
      empty={<Empty title="No refunds here" sub="Refunds are requested automatically when a paid trip booking is cancelled." />} />
  );
}

function EventRefundsTable({ rows, loading, canRecord, onOpen, onRecord }: {
  rows: EventRefundRow[] | null; loading: boolean; canRecord: boolean; onOpen: (r: EventRefundRow) => void; onRecord: (r: EventRefundRow) => void;
}) {
  const columns: Column<EventRefundRow>[] = [
    { key: "who", label: "Customer", render: (r) => <Person name={r.name} sub={r.phone} /> },
    { key: "amount", label: "Refund", align: "end", render: (r) => <span><strong className="font-semibold">{money(r.amount, 2)}</strong>
      <span className="block text-caption-1-medium text-text-tertiary">{r.percent}% of {money(r.paid)}</span></span> },
    { key: "for", label: "Event", render: (r) => <Stacked main={r.title || "—"} sub={r.reference} /> },
    { key: "by", label: "Cancelled by", render: (r) => <Stacked main={r.cancelled_by} sub={r.reason || undefined} />, hideOnMobile: true },
    { key: "status", label: "Status", render: (r) => <StatusPill status={r.status} label={r.status_label} tone={EVENT_REFUND_TONE[r.status]} /> },
    { key: "when", label: "Cancelled", render: (r) => <span className="whitespace-nowrap text-text-secondary">{ago(r.created_at)}</span>, hideOnMobile: true },
  ];
  return (
    <DataTable rows={rows} loading={loading} rowKey={(r) => r.id} columns={columns} onRowClick={onOpen}
      actions={(r) => r.status === "DUE" && canRecord ? (
        <Button size="small" variant="primary" leadingIcon={RiCheckLine} onClick={() => onRecord(r)}>Record refund</Button>
      ) : null}
      empty={<Empty title="No event refunds here" sub="When a paid event booking is cancelled, the refund to send by UPI appears here." />} />
  );
}

/* ---------- drawers ---------- */

function PaymentDrawer({ payment: p, canVerify, busy, onClose, onVerify, onReject }: {
  payment: TripPayment | null; canVerify: boolean; busy: string; onClose: () => void; onVerify: (p: TripPayment) => void; onReject: (p: TripPayment) => void;
}) {
  return (
    <Drawer open={!!p} onClose={onClose} title={p ? money(p.amount, 2) : ""} sub={p?.name}
      footer={p?.status === "PENDING_VERIFICATION" && canVerify && <>
        <Button variant="primary" leadingIcon={RiCheckLine} disabled={busy === p.id} onClick={() => onVerify(p)}>Verify payment</Button>
        <Button variant="secondary" onClick={() => onReject(p)}>Reject</Button>
      </>}>
      {p && (
        <div className="flex flex-col gap-4">
          <StatusPill status={p.status} label={p.status === "PENDING_VERIFICATION" ? "Waiting for a second staff member to verify" : tripStatusLabel(p.status)} />
          <Facts items={[
            ["Trip", p.title || "—"], ["Bookings", p.bookings.join(", ") || "—"], ["Method", p.method === "MANUAL" ? "Cash / bank transfer" : "Online (Razorpay)"],
            ["Type", nice(p.kind)], ["Reference", p.reference || "—"], ["Date", dateOnly(p.created_at)], ["Phone", p.phone],
            ...(p.failure_reason ? [["Reason", p.failure_reason] as [string, string]] : []),
          ]} />
          <LinkButtons tripId={p.parent_id} tripTab="payments" customerId={p.customer_id} />
        </div>
      )}
    </Drawer>
  );
}

function RefundDrawer({ refund: r, canApprove, busy, onClose, onApprove }: {
  refund: RefundRow | null; canApprove: boolean; busy: string; onClose: () => void; onApprove: (r: RefundRow) => void;
}) {
  return (
    <Drawer open={!!r} onClose={onClose} title={r ? money(r.amount, 2) : ""} sub={r ? `Refund for ${r.name}` : undefined}
      footer={r?.status === "REQUESTED" && canApprove && (
        <Button variant="primary" leadingIcon={RiCheckLine} disabled={busy === r.id} onClick={() => onApprove(r)}>Approve refund</Button>
      )}>
      {r && (
        <div className="flex flex-col gap-4">
          <StatusPill status={r.status} label={refundStatusLabel(r.status)} />
          <Facts items={[
            ["Trip", r.title || "—"], ["Booking", r.booking], ["Reason", r.reason || "—"], ["Requested", dateOnly(r.created_at)],
            ["Approved by", r.approved_by || "—"], ["Phone", r.phone],
          ]} />
          {r.status === "REQUESTED" && <p className="text-body-regular text-text-secondary">Approving sends the money back to the customer's original online payment. Cash payments must be returned by hand.</p>}
          <LinkButtons tripId={r.parent_id} tripTab="bookings" customerId={r.customer_id} />
        </div>
      )}
    </Drawer>
  );
}

function EventRefundDrawer({ refund: r, canRecord, onClose, onRecord }: {
  refund: EventRefundRow | null; canRecord: boolean; onClose: () => void; onRecord: (r: EventRefundRow) => void;
}) {
  return (
    <Drawer open={!!r} onClose={onClose} title={r ? money(r.amount, 2) : ""} sub={r ? `Event refund for ${r.name}` : undefined}
      footer={r?.status === "DUE" && canRecord && <Button variant="primary" leadingIcon={RiCheckLine} onClick={() => onRecord(r)}>Record refund</Button>}>
      {r && (
        <div className="flex flex-col gap-4">
          <StatusPill status={r.status} label={r.status_label} tone={EVENT_REFUND_TONE[r.status]} />
          <Facts items={[
            ["Event", r.title || "—"], ["Event date", dateOnly(r.starts_at)], ["Booking", r.reference], ["Paid", money(r.paid, 2)],
            ["Refund", `${money(r.amount, 2)} (${r.percent}%)`], ["Cancelled by", r.cancelled_by], ["Reason", r.reason || "—"],
            ["Cancelled", dateOnly(r.created_at)], ["Phone", r.phone],
            ...(r.status !== "DUE" ? [["UPI reference", r.upi_reference || "—"], ["Note", r.note || "—"], ["Recorded by", r.recorded_by || "—"],
              ["Recorded", r.recorded_at ? dateOnly(r.recorded_at) : "—"]] as [string, string][] : []),
          ]} />
          {r.status === "DUE" && <p className="text-body-regular text-text-secondary">Send the money to the customer by UPI (to {r.phone}), then record it here. The customer gets a WhatsApp message.</p>}
          <div className="flex flex-wrap gap-2">
            <Button size="small" variant="secondary" onClick={() => window.location.assign(`/admin/overview/event/${r.parent_id}?tab=bookings`)}>Open event</Button>
            {r.customer_id && <Button size="small" variant="secondary" onClick={() => window.location.assign(`/admin/customer/${r.customer_id}`)}>Open customer</Button>}
          </div>
        </div>
      )}
    </Drawer>
  );
}

function RecordRefundForm({ refund: r, onClose, onSaved }: { refund: EventRefundRow; onClose: () => void; onSaved: () => void }) {
  const [outcome, setOutcome] = useState<"sent" | "not_refunded">("sent");
  const [amount, setAmount] = useState(Number(r.amount).toFixed(2));
  const [utr, setUtr] = useState("");
  const [note, setNote] = useState("");
  const { busy, errors, general, submit } = useFormSubmit();
  const sent = outcome === "sent";
  const valid = sent ? Number(amount) > 0 && Number(amount) <= Number(r.paid) : note.trim().length > 0;

  const save = async () => {
    const ok = await submit(() => adminApi.action("record-event-refund", {
      refund_id: r.id, outcome, note: note.trim(), ...(sent ? { amount, upi_reference: utr.trim() } : {}),
    }));
    if (ok) onSaved();
  };

  return (
    <FormModal title={`Refund for ${r.name}`} description={`${r.title} · ${r.reference}. Due: ${money(r.amount, 2)} (${r.percent}% of ${money(r.paid, 2)}).`}
      submitLabel={sent ? "Record as sent" : "Record no refund"} busy={busy} general={general} canSubmit={valid} onSubmit={save} onClose={onClose}>
      <FilterPills value={outcome} onChange={setOutcome} options={[{ key: "sent", label: "I've sent it" }, { key: "not_refunded", label: "Not refunding" }]} />
      {sent ? (
        <>
          <Input label="Amount sent (₹)" type="number" value={amount} onChange={setAmount} errorMessage={errors.amount}
            hint={`Up to ${money(r.paid, 2)}, what the customer paid.`} />
          <Input label="UPI transaction ID (optional)" value={utr} onChange={setUtr} placeholder="e.g. 431234567890" errorMessage={errors.upi_reference}
            hint="Shown to the customer in their WhatsApp message." />
          <Input label="Note (optional)" value={note} onChange={setNote} />
        </>
      ) : (
        <Input label="Why no refund?" value={note} onChange={setNote} placeholder="e.g. Payment never arrived" errorMessage={errors.note}
          hint="Staff only. The customer is not messaged." />
      )}
    </FormModal>
  );
}

/* ---------- small pieces ---------- */

function Stacked({ main, sub }: { main: string; sub?: string }) {
  return (
    <span className="block max-w-[240px]">
      <span className="block truncate">{main}</span>
      {sub && <span className="block truncate text-caption-1-medium text-text-tertiary">{sub}</span>}
    </span>
  );
}

function UtrCell({ utr, duplicate }: { utr?: string; duplicate?: boolean }) {
  if (!utr) return <span className="text-text-tertiary">—</span>;
  return (
    <span className="flex flex-col gap-1">
      <span className="font-mono text-caption-1-medium">{utr}</span>
      {duplicate && (
        <span className="inline-flex items-center gap-1 text-caption-1-medium text-rose-600 dark:text-rose-400" title="This UPI reference was also entered on another booking.">
          <RiAlertLine className="size-3.5" aria-hidden /> Used on another booking
        </span>
      )}
    </span>
  );
}

function LinkButtons({ tripId, tripTab, customerId }: { tripId: string | null; tripTab: string; customerId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tripId && <Button size="small" variant="secondary" onClick={() => window.location.assign(`/admin/overview/trip/${tripId}?tab=${tripTab}`)}>Open trip</Button>}
      <Button size="small" variant="secondary" onClick={() => window.location.assign(`/admin/customer/${customerId}`)}>Open customer</Button>
    </div>
  );
}

const EVENT_REFUND_TONE: Record<EventRefundRow["status"], "amber" | "green" | "gray"> = { DUE: "amber", SENT: "green", NOT_REFUNDED: "gray" };

const tripStatusLabel = (status: string) =>
  status === "PENDING_VERIFICATION" ? "To verify" : status === "SUCCEEDED" ? "Received" : nice(status);

const refundStatusLabel = (status: string) =>
  ({ REQUESTED: "To approve", APPROVED: "Approved", PROCESSING: "Sending", PROCESSED: "Refunded", FAILED: "Failed", REJECTED: "Rejected" } as Record<string, string>)[status] ?? nice(status);
