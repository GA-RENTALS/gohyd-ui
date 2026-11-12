"use client";
import {
  RiAddLine, RiCheckLine, RiDeleteBin6Line, RiEditLine, RiExternalLinkLine, RiEyeLine, RiImageAddLine, RiImageLine, RiRefreshLine,
} from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ImageUpload, MediaThumb } from "@/components/admin/ImageUpload";
import { RelatedList, schemaOf } from "@/components/admin/RelatedList";
import { Cell, PromptModal, RecordForm } from "@/components/admin/ResourceView";
import { PageHeader } from "@/components/admin/Shell";
import { StatusPill } from "@/components/admin/ui";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { AlertDialog, Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { Skeleton } from "@/components/base/skeleton/skeleton";
import { Tab, TabList, Tabs } from "@/components/base/tabs/tabs";
import { toast } from "@/components/base/toast/toast";
import { adminApi, type Overview, type Schema } from "@/lib/admin/api";
import { cx } from "@/utils/cx";

type Reg = Overview["registrations"][number];
type Row = Record<string, any>;
const money = (v: string | number) => `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const when = (v?: string | null) => (v ? new Date(v).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—");
const day = (v: string) => new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const LANG: Record<string, string> = { en: "English", te: "Telugu", hi: "Hindi" };
const optionLabel = (s: Schema, field: string, value: unknown) => s.fields.find((f) => f.name === field)?.options?.find((o) => o.value === String(value))?.label ?? String(value ?? "—");
const missingLangs = (r: Row, base: string) => {
  const gaps = ["te", "hi"].filter((l) => !String(r[`${base}_${l}`] ?? "").trim()).map((l) => LANG[l]);
  return gaps.length ? <span className="text-caption-1-medium text-text-tertiary">{gaps.join(" & ")} missing</span> : null;
};

const nice = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

const TABS = ["overview", "bookings", "payments", "participants", "details", "dates", "itinerary", "content"] as const;
type TabKey = (typeof TABS)[number];

/** Everything about one trip or event on one page: numbers, bookings, payments, people, and all its content. */
export function OverviewPage({ kind, id }: { kind: "trip" | "event"; id: string }) {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState("");
  const [schedule, setSchedule] = useState("");
  const [tab, setTab] = useState<TabKey>("overview");
  const [form, setForm] = useState<{ schema: Schema; row: any | null; defaults?: Record<string, any>; hidden?: string[] } | null>(null);
  const [viewing, setViewing] = useState<Reg | null>(null);
  const [paying, setPaying] = useState<Reg | null>(null);
  const [prompt, setPrompt] = useState<{ title: string; label: string; run: (text: string) => Promise<void> } | null>(null);
  const [busy, setBusy] = useState("");
  const [deleting, setDeleting] = useState(false);

  // ?tab=details (used right after creating a trip/event)
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab") as TabKey | null;
    if (t && TABS.includes(t)) setTab(t);
  }, []);

  const load = useCallback(() => {
    adminApi.overview(kind, id, schedule || undefined).then((d) => { setData(d); setErr(""); }).catch((e) => setErr(e.message));
  }, [kind, id, schedule]);
  useEffect(load, [load]);

  /** Run a backend call, show the result, then reload so every number on the page matches the database. */
  async function act(key: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(key);
    try { await fn(); toast(ok, { status: "success" }); load(); }
    catch (e: any) { toast(e.message || "Something went wrong", { status: "error" }); throw e; }
    finally { setBusy(""); }
  }
  const quiet = (p: Promise<unknown>) => p.catch(() => {});

  async function edit(resource: string, recordId: string | null, defaults?: Record<string, any>, hidden?: string[]) {
    try {
      const [schema, row] = await Promise.all([schemaOf(resource), recordId ? adminApi.get(resource, recordId) : Promise.resolve(null)]);
      setForm({ schema, row, defaults, hidden });
    } catch (e: any) { toast(e.message || "Couldn't open the form", { status: "error" }); }
  }

  const isTrip = kind === "trip";
  const base = isTrip ? "trip" : "event";            // prefix of related tables: trip-faqs, event-faqs…
  const parent = isTrip ? "trip" : "event";          // foreign-key field name on those tables
  const listHref = isTrip ? "/admin/trips/trips" : "/admin/events/events";
  const listLabel = isTrip ? "Trips" : "Events";

  if (err) return (
    <>
      <PageHeader crumbs={[{ label: listLabel, href: listHref }, "Not found"]} title="Couldn't open this page" />
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-body-medium text-text-error-primary">{err}</p>
        <Button variant="secondary" onClick={load}>Try again</Button>
      </div>
    </>
  );
  if (!data) return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-80 w-full rounded-2xl" />
    </div>
  );

  const p = data.permissions;
  const s = data.stats;
  const published = data.status === "PUBLISHED";
  const regs = data.registrations;
  const proofs = regs.filter((r) => r.status === "PENDING" || r.payment_proof_url);
  const toVerify = isTrip ? data.pending_payments.length : regs.filter((r) => r.status === "PENDING").length;
  const balanceDue = regs.filter((r) => Number(r.outstanding) > 0 && r.status !== "PENDING_ADVANCE").length;

  const tabLabel: Record<TabKey, string> = {
    overview: "Overview",
    bookings: `Bookings (${regs.length})`,
    payments: isTrip ? `Payments${toVerify ? ` · ${toVerify} to verify` : ""}` : `Payments${toVerify ? ` · ${toVerify} to confirm` : ""}`,
    participants: `Participants (${data.participants.length})`,
    details: "Details & translations",
    dates: `Dates (${data.schedules.length})`,
    itinerary: "Itinerary",
    content: isTrip ? "Inclusions, pickups & policies" : "Highlights, rules & FAQs",
  };
  const visibleTabs = TABS.filter((t) => t !== "payments" || p.payments || !isTrip);
  const showsDateFilter = ["overview", "bookings", "payments", "participants"].includes(tab) && data.schedules.length > 1;

  /* ---------- tab bodies ---------- */

  const statTiles = (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {[
        { label: "Total registrations", value: String(s.registrations), note: `${s.participants} ${s.participants === 1 ? "person" : "people"}` },
        { label: "Paid", value: String(s.paid), note: isTrip ? "Fully paid" : "Confirmed" },
        { label: "Pending payment", value: String(s.pending), note: s.pending_with_proof ? `${s.pending_with_proof} sent payment proof` : `${money(s.outstanding)} due` },
        { label: "Revenue", value: money(s.revenue), note: isTrip ? "Collected, after refunds" : "From confirmed bookings" },
        { label: "Cancelled", value: String(s.cancelled), note: isTrip ? undefined : "Includes expired holds" },
      ].map((x) => (
        <div key={x.label} className="rounded-xl border border-border-button-default bg-background-primary-default p-4">
          <p className="text-body-regular text-text-secondary">{x.label}</p>
          <p className="mt-1 text-title-2-semibold text-text-primary">{x.value}</p>
          {x.note && <p className="mt-0.5 text-caption-1-medium text-text-tertiary">{x.note}</p>}
        </div>
      ))}
    </div>
  );

  const bookingActions = (r: Reg) => (
    <Actions>
      <Button size="small" variant="secondary" leadingIcon={RiEyeLine} onClick={() => setViewing(r)}>View</Button>
      {isTrip && p.record_payment && Number(r.outstanding) > 0 && (
        <Button size="small" variant="secondary" onClick={() => setPaying(r)}>Record payment</Button>
      )}
      {!isTrip && p.confirm && r.status === "PENDING" && (
        <Button size="small" variant="primary" leadingIcon={RiCheckLine} disabled={busy === r.id}
          onClick={() => quiet(act(r.id, () => adminApi.update("event-registrations", r.id, { status: "CONFIRMED" }), `${r.reference} confirmed`))}>Confirm</Button>
      )}
      {!isTrip && p.confirm && (r.status === "PENDING" || r.status === "CONFIRMED") && (
        <Button size="small" variant="secondary" leadingIcon={RiEditLine} onClick={() => edit("event-registrations", r.id)}>Edit</Button>
      )}
      {p.cancel && !/(CANCELLED|EXPIRED|COMPLETED|NO_SHOW)/.test(r.status) && (
        <Button size="small" variant="danger" onClick={() => setPrompt({
          title: `Cancel ${r.reference}`,
          label: isTrip ? "Reason (a refund is requested automatically according to the refund policy)" : "Reason",
          run: (reason) => act(r.id, () => isTrip
            ? adminApi.action("cancel-booking", { booking_id: r.id, reason })
            : adminApi.update("event-registrations", r.id, { status: "CANCELLED", staff_note: reason }), `${r.reference} cancelled`),
        })}>Cancel</Button>
      )}
    </Actions>
  );

  const bookingsTable = (rows: Reg[]) => (
    <SimpleTable
      empty={p.bookings ? "No bookings for this selection yet." : "You don't have permission to see bookings."}
      head={["Reference", "Booked by", "Date", "People", "Total", "Paid", "Due", "Status", ""]}
      rows={rows.map((r) => [
        <span key="ref" className="font-medium">{r.reference}</span>,
        <span key="who"><span className="block text-text-primary">{r.name}</span><span className="text-text-tertiary">{r.phone}</span></span>,
        day(r.starts_at), r.participants, money(r.total), money(r.paid),
        Number(r.outstanding) > 0 ? <span key="due" className="text-text-error-primary">{money(r.outstanding)}</span> : "—",
        <span key="st" className="flex items-center gap-1.5">
          <StatusPill status={String(r.status)} label={r.status_label} />
          {r.payment_proof_url && r.status === "PENDING" && <StatusPill status="info" tone="blue" label="Proof sent" />}
        </span>,
        <span key="a">{bookingActions(r)}</span>,
      ])}
    />
  );

  const overviewTab = (
    <div className="flex flex-col gap-4">
      {statTiles}
      {(toVerify > 0 || balanceDue > 0) && (
        <section className="rounded-2xl border border-border-button-default bg-background-primary-default p-4">
          <h3 className="mb-2 text-headline-medium text-text-primary">Needs attention</h3>
          <ul className="flex flex-col gap-2 text-body-medium">
            {toVerify > 0 && (
              <li className="flex flex-wrap items-center justify-between gap-2">
                <span>{isTrip ? `${toVerify} manual payment${toVerify === 1 ? "" : "s"} waiting to be verified` : `${toVerify} booking${toVerify === 1 ? "" : "s"} waiting for payment confirmation${s.pending_with_proof ? ` (${s.pending_with_proof} sent proof)` : ""}`}</span>
                <Button size="small" variant="primary" onClick={() => setTab("payments")}>Review payments</Button>
              </li>
            )}
            {isTrip && balanceDue > 0 && (
              <li className="flex flex-wrap items-center justify-between gap-2">
                <span>{balanceDue} booking{balanceDue === 1 ? " has" : "s have"} a balance still due</span>
                <Button size="small" variant="secondary" onClick={() => setTab("bookings")}>See bookings</Button>
              </li>
            )}
          </ul>
        </section>
      )}
      <section className="rounded-2xl border border-border-button-default bg-background-primary-default p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-headline-medium text-text-primary">Dates</h3>
          <Button size="small" variant="secondary" onClick={() => setTab("dates")}>Manage dates</Button>
        </div>
        {data.schedules.length === 0 ? <p className="text-body-regular text-text-tertiary">No dates yet. Add one so customers can book.</p> : (
          <ul className="flex flex-col gap-3">
            {data.schedules.map((d) => {
              const pct = d.capacity ? Math.min(100, Math.round((d.booked / d.capacity) * 100)) : 0;
              return (
                <li key={d.id} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[200px_1fr_auto]">
                  <span className="text-body-medium text-text-primary">{when(d.starts_at)}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-background-secondary-default"><div className="h-full rounded-full bg-text-primary" style={{ width: `${pct}%` }} /></div>
                  <span className="text-body-regular text-text-secondary">{d.capacity != null ? `${d.booked}/${d.capacity} seats` : `${d.booked} booked`}{!d.is_open && " · closed"}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-headline-medium text-text-primary">Latest bookings</h3>
          {regs.length > 5 && <Button size="small" variant="secondary" onClick={() => setTab("bookings")}>See all {regs.length}</Button>}
        </div>
        {bookingsTable(regs.slice(0, 5))}
      </section>
    </div>
  );

  const paymentsTab = isTrip ? (
    <SimpleTable
      empty="No payments yet for this selection."
      head={["Amount", "Status", "Type", "Method", "Reference", "Payer", "Bookings", "Date", ""]}
      rows={data.payments.map((x) => [
        <span key="amt" className="font-medium">{money(x.amount)}</span>,
        <StatusPill key="st" status={String((x.status))} label={nice(String(x.status))} />,
        nice(x.kind), nice(x.method), x.reference || "—", x.payer, x.bookings.join(", "), when(x.created_at),
        <Actions key="act">
          {p.verify_payment && x.status === "PENDING_VERIFICATION" && <>
            <Button size="small" variant="primary" disabled={busy === x.id}
              onClick={() => quiet(act(x.id, () => adminApi.action("verify-payment", { payment_id: x.id, approved: true }), "Payment verified"))}>Verify</Button>
            <Button size="small" variant="danger" onClick={() => setPrompt({
              title: "Reject payment", label: "Reason",
              run: (note) => act(x.id, () => adminApi.action("verify-payment", { payment_id: x.id, approved: false, note }), "Payment rejected"),
            })}>Reject</Button>
          </>}
        </Actions>,
      ])}
    />
  ) : (
    <div className="flex flex-col gap-3">
      <p className="text-body-regular text-text-secondary">Customers pay by UPI and upload a screenshot. Check the payment, then confirm the booking. Confirmed bookings count as paid.</p>
      {proofs.length === 0 && <p className="rounded-xl bg-background-secondary-default px-4 py-8 text-center text-body-regular text-text-tertiary">Nothing waiting. New payment proofs appear here.</p>}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {proofs.map((r) => (
          <article key={r.id} className="flex gap-3 rounded-2xl border border-border-button-default bg-background-primary-default p-3">
            <a href={r.payment_proof_url || undefined} target="_blank" rel="noopener noreferrer"
              className="grid h-32 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-border-button-default bg-background-secondary-default">
              {r.payment_proof_url
                ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={r.payment_proof_url} alt="Payment screenshot" className="size-full object-cover" />
                : <span className="px-2 text-center text-caption-1-medium text-text-tertiary"><RiImageLine className="mx-auto mb-1 size-5" aria-hidden />No proof yet</span>}
            </a>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-body-medium text-text-primary">{r.name}</span>
                <StatusPill status={String(r.status)} label={r.status_label} />
              </div>
              <span className="text-body-regular text-text-secondary">{r.reference} · {r.participants} {r.participants === 1 ? "person" : "people"}</span>
              <span className="text-title-3-semibold text-text-primary">{money(r.total)}</span>
              <span className="text-caption-1-medium text-text-tertiary">UTR: {r.payment_utr || "—"} · {day(r.starts_at)}</span>
              <div className="mt-auto pt-1">{bookingActions(r)}</div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );

  const participantsTab = (
    <SimpleTable
      empty={p.participants ? "No participants yet." : "You don't have permission to see participants."}
      head={isTrip ? ["Name", "Phone", "Age", "Booking", "Emergency contact", "Waiver", "Checked in", ""] : ["Name", "Phone", "Booking", "Group", "Booking status", "Checked in", ""]}
      rows={data.participants.map((x) => {
        const checkIn = p.check_in && !x.checked_in_at && (isTrip || x.booking_status === "CONFIRMED") && (
          <Button size="small" variant="primary" leadingIcon={RiCheckLine} disabled={busy === (x.id || x.registration_id)}
            onClick={() => quiet(act(String(x.id || x.registration_id), () => isTrip
              ? adminApi.action("participant-check-in", { participant_id: x.id })
              : adminApi.action("event-check-in", x.id ? { participant_id: x.id } : { registration_id: x.registration_id }), `${x.name} checked in`))}>Check in</Button>
        );
        const editBtn = isTrip && p.check_in && x.id && (
          <Button size="small" variant="secondary" leadingIcon={RiEditLine} onClick={() => edit("participants", x.id!)}>Edit</Button>
        );
        const checked = x.checked_in_at ? <StatusPill key="in" status="DONE" tone="green" label={when(x.checked_in_at)} /> : <span key="in" className="text-text-tertiary">Not yet</span>;
        return isTrip
          ? [x.name, x.phone || "—", x.age ?? "—", x.booking, x.emergency_contact || "—", x.waiver ? "Accepted" : "—", checked, <Actions key="a">{checkIn}{editBtn}</Actions>]
          : [x.name, x.phone || "—", x.booking, x.group_size ? `${x.group_size} people` : "—",
            <StatusPill key="bs" status={String((x.booking_status))} label={nice(String(x.booking_status))} />, checked, <Actions key="a">{checkIn}</Actions>];
      })}
    />
  );

  const detailsTab = (
    <div className="flex flex-col gap-4">
      <PhotosCard resource={isTrip ? "trips" : "events"} id={data.id} onSaved={load} />
      <MainDetails resource={isTrip ? "trips" : "events"} id={data.id} onSaved={load} />
      <RelatedList resource={`${base}-translations`} parentField={parent} parentId={data.id} title="Title & description"
        hint="English is needed to publish. Telugu and Hindi are optional: add them whenever you like and they show on the website straight away. Until then, visitors see English."
        addLabel="Add language" onChange={load}
        primary={(r) => <span className="flex flex-wrap items-center gap-2"><strong>{LANG[r.language] ?? r.language}</strong> {r.title}</span>}
        secondary={(r) => r.summary ? <span className="line-clamp-2">{r.summary}</span> : null} />
    </div>
  );

  const datesTab = isTrip ? (
    <RelatedList resource="trip-schedules" parentField="trip" parentId={data.id} title="Departure dates" addLabel="Add date" onChange={load}
      hint="Each date has its own seats and price. Close a date to stop new bookings."
      primary={(r) => <span className="flex flex-wrap items-center gap-2">{when(r.starts_at)} → {when(r.ends_at)}{!r.is_open && <StatusPill status="closed" tone="gray" label="Closed" />}</span>}
      secondary={(r) => `${r.seats_booked}/${r.capacity} seats booked · ${money(r.price_per_participant)} per person`}
      nested={(r) => (
        <RelatedList compact resource="trip-pricing-rules" parentField="schedule" parentId={String(r.id)} title="Price changes for this date" addLabel="Add price rule"
          primary={(x) => `${x.label}: ${Number(x.amount_delta) < 0 ? "−" : "+"}${money(Math.abs(Number(x.amount_delta)))}`}
          secondary={(x) => [x.min_participants && `from ${x.min_participants} people`, x.valid_until && `until ${when(x.valid_until)}`].filter(Boolean).join(" · ") || null} />
      )} />
  ) : (
    <RelatedList resource="event-schedules" parentField="event" parentId={data.id} title="Event dates" addLabel="Add date" onChange={load}
      hint="Leave capacity empty for unlimited places."
      primary={(r) => <span>{when(r.starts_at)}{r.ends_at ? ` → ${when(r.ends_at)}` : ""}{r.time_tbd ? " (time to be confirmed)" : ""}</span>}
      secondary={(r) => {
        const sched = data.schedules.find((x) => x.id === String(r.id));
        return `${sched?.booked ?? 0} booked${r.capacity != null ? ` of ${r.capacity}` : ""}`;
      }} />
  );

  const itineraryTab = (
    <RelatedList resource={`${base}-itineraries`} parentField={parent} parentId={data.id} title="Itinerary" addLabel="Add day"
      hint="Add a day, then add the steps for that day."
      primary={(r) => <span><strong>Day {r.day_number}</strong> · {r.title_en}</span>}
      secondary={(r) => missingLangs(r, "title")}
      nested={(r) => (
        <RelatedList compact resource={`${base}-itinerary-items`} parentField="itinerary" parentId={String(r.id)} title="Steps" addLabel="Add step"
          primary={(x) => <span>{x.time_label && <strong className="me-2">{x.time_label}</strong>}{x.text_en}</span>}
          secondary={(x) => <>{x.detail_en && <span className="me-2">{x.detail_en}</span>}{missingLangs(x, "text")}</>} />
      )} />
  );

  const textList = (resource: string, title: string, addLabel: string, hint?: string) => (
    <RelatedList key={resource} resource={resource} parentField={parent} parentId={data.id} title={title} addLabel={addLabel} hint={hint}
      primary={(r) => r.text_en} secondary={(r) => missingLangs(r, "text")} />
  );

  const contentTab = isTrip ? (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {textList("trip-inclusions", "What's included", "Add item")}
      {textList("trip-exclusions", "Not included", "Add item")}
      {textList("trip-things-to-bring", "Things to bring", "Add item")}
      <RelatedList resource="trip-pickup-points" parentField="trip" parentId={data.id} title="Pickup points" addLabel="Add pickup"
        primary={(r) => <span>{r.pickup_time && <strong className="me-2">{String(r.pickup_time).slice(0, 5)}</strong>}{r.name}</span>} secondary={(r) => r.address || null} />
      <RelatedList resource="trip-policies" parentField="trip" parentId={data.id} title="Refund policy" addLabel="Add rule"
        hint="Refund % when a customer cancels at least this many days before."
        primary={(r) => `${r.days_before}+ days before: ${Number(r.refund_basis_points) / 100}% refund`} secondary={(r) => r.note || null} sortBy={["days_before"]} />
      <RelatedList resource="trip-destinations" parentField="trip" parentId={data.id} title="Destinations visited" addLabel="Add destination"
        primary={(r, sc) => optionLabel(sc, "destination", r.destination)} />
      <RelatedList resource="trip-media" parentField="trip" parentId={data.id} title="Photo gallery" addLabel="Add photo"
        hint="Extra photos shown on the trip page. The main photo is the Cover in Main details."
        primary={(r, sc) => <span className="flex items-center gap-3"><MediaThumb id={r.asset} className="h-14 w-20" /><span>{optionLabel(sc, "asset", r.asset)}</span></span>} />
      <RelatedList resource="faqs" parentField="trip" parentId={data.id} title="FAQs" addLabel="Add question"
        primary={(r) => r.question_en} secondary={(r) => r.answer_en} />
    </div>
  ) : (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {textList("event-highlights", "Highlights", "Add highlight")}
      <RelatedList resource="event-format-details" parentField="event" parentId={data.id} title="Event format" addLabel="Add row"
        hint="Shown as a small table, e.g. Format: 6-a-side."
        primary={(r) => <span><strong className="me-2">{r.label_en}:</strong>{r.value_en}</span>} secondary={(r) => missingLangs(r, "label")} />
      {textList("event-inclusions", "What's included", "Add item")}
      {textList("event-exclusions", "Not included", "Add item")}
      {textList("event-things-to-bring", "Things to bring", "Add item")}
      {textList("event-rules", "Rules & guidelines", "Add rule")}
      <RelatedList resource="event-faqs" parentField="event" parentId={data.id} title="FAQs" addLabel="Add question"
        primary={(r) => r.question_en} secondary={(r) => r.answer_en} />
    </div>
  );

  const body: Record<TabKey, ReactNode> = {
    overview: overviewTab, bookings: bookingsTable(regs), payments: paymentsTab, participants: participantsTab,
    details: detailsTab, dates: datesTab, itinerary: itineraryTab, content: contentTab,
  };

  return (
    <>
      <PageHeader
        crumbs={[{ label: listLabel, href: listHref }, data.title]}
        title={data.title}
        actions={<>
          <Button variant="secondary" leadingIcon={RiRefreshLine} onClick={load}>Refresh</Button>
          {published && (
            <a href={`/${kind}s/${data.slug}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-button-default px-3 text-body-medium text-text-primary hover:bg-background-secondary-default">
              <RiExternalLinkLine className="size-4" aria-hidden /> View on site
            </a>
          )}
          {p.edit && !published && (
            <Button variant="primary" disabled={busy === "publish"} onClick={() => quiet(act("publish", () => adminApi.action("content-transition", { resource: isTrip ? "trips" : "events", id: data.id, status: "PUBLISHED" }), "Published"))}>Publish</Button>
          )}
          {p.delete && <Button variant="danger" leadingIcon={RiDeleteBin6Line} onClick={() => setDeleting(true)}>Delete {kind}</Button>}
        </>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setTab("details")} title={data.cover_url ? "Change photo" : "Add a cover photo"}
          className="group relative grid h-14 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-border-button-default bg-background-secondary-default">
          {data.cover_url
            ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={data.cover_url} alt="Cover" className="size-full object-cover" />
            : <span className="flex flex-col items-center text-caption-1-medium text-text-tertiary"><RiImageAddLine className="size-5" aria-hidden />Add photo</span>}
          {data.cover_url && <span className="absolute inset-0 hidden place-items-center bg-black/45 text-caption-1-medium text-white group-hover:grid">Change</span>}
        </button>
        <div className="flex flex-wrap items-center gap-2 text-body-regular text-text-secondary">
          <StatusPill status={data.status} tone={published ? "green" : "amber"} label={published ? "Live on website" : `${nice(data.status)}: not on website`} />
          {data.operational_label && <StatusPill status={String(data.operational_status)} tone={data.operational_status === "OPEN" ? "green" : "gray"} label={data.operational_label} />}
          {data.venue && <span>{data.venue}</span>}
          {data.price && Number(data.price) > 0 && <span>· {money(data.price)} per person</span>}
        </div>
      </div>

      <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(k as TabKey)} className="mb-4 !w-auto max-w-full overflow-x-auto">
        <TabList aria-label="Sections">
          {visibleTabs.map((t) => <Tab key={t} id={t}>{tabLabel[t]}</Tab>)}
        </TabList>
      </Tabs>

      {showsDateFilter && (
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by date">
          <DateChip active={!schedule} onClick={() => setSchedule("")} label="All dates" />
          {data.schedules.map((d) => (
            <DateChip key={d.id} active={schedule === d.id} onClick={() => setSchedule(d.id)}
              label={day(d.starts_at)} note={d.capacity != null ? `${d.booked}/${d.capacity}` : `${d.booked} booked`} />
          ))}
        </div>
      )}

      {body[tab]}

      {viewing && <BookingDetails reg={viewing} isTrip={isTrip} onClose={() => setViewing(null)} />}
      {paying && <RecordPaymentModal reg={paying} onClose={() => setPaying(null)}
        onSave={(b) => act(paying.id, () => adminApi.action("record-manual-payment", b), "Payment recorded. A second staff member must verify it.")} />}
      {form && <RecordForm schema={form.schema} row={form.row} defaults={form.defaults} hidden={form.hidden} onClose={() => setForm(null)}
        onSaved={() => { setForm(null); toast("Saved", { status: "success" }); load(); }} />}
      {prompt && <PromptModal {...prompt} onClose={() => setPrompt(null)} />}
      <AlertDialog isOpen={deleting} onOpenChange={(o) => !o && setDeleting(false)} title={`Delete “${data.title}”?`}
        description={`This permanently removes the ${kind} with its dates, itinerary and translations. A ${kind} that has bookings can't be deleted; unpublish it or cancel its bookings instead.`}
        confirmLabel="Delete" pendingLabel="Deleting…"
        onConfirm={async () => {
          try {
            await adminApi.remove(isTrip ? "trips" : "events", data.id);
            toast(`${isTrip ? "Trip" : "Event"} deleted`, { status: "success" });
            router.push(listHref);
          } catch (e: any) { toast(e.message || "Couldn't delete", { status: "error" }); throw e; }
        }} />
    </>
  );
}

/** Cover (and, for events, popup banner and payment QR): upload, replace or remove, saved straight away. */
function PhotosCard({ resource, id, onSaved }: { resource: string; id: string; onSaved: () => void }) {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [row, setRow] = useState<Row | null>(null);
  useEffect(() => { Promise.all([schemaOf(resource), adminApi.get(resource, id)]).then(([s, r]) => { setSchema(s); setRow(r); }).catch(() => {}); }, [resource, id]);
  const fields = (schema?.fields ?? []).filter((f) => f.media && !f.many && !f.read_only);
  if (!schema || !row || !fields.length || !schema.actions.update) return null;
  async function save(field: string, value: string) {
    try {
      const saved = await adminApi.update(resource, id, { [field]: value || null });
      setRow(saved as Row);
      toast(value ? "Photo saved" : "Photo removed", { status: "success" });
      onSaved();
    } catch (e: any) { toast(e.message || "Couldn't save the photo", { status: "error" }); }
  }
  return (
    <section className="rounded-2xl border border-border-button-default bg-background-primary-default p-4">
      <h3 className="text-headline-medium text-text-primary">Photos</h3>
      <p className="mb-3 text-body-regular text-text-secondary">Upload straight from your computer. Changes save immediately.</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {fields.map((f) => (
          <ImageUpload key={f.name} label={f.name === "cover" ? "Cover photo (main image)" : f.label} value={row[f.name] ? String(row[f.name]) : ""}
            hint={f.help_text || undefined} onChange={(v) => save(f.name, v)} />
        ))}
      </div>
    </section>
  );
}

/** The trip's / event's own fields (slug, cover, price, booking rules…) as a readable card with one Edit button. */
function MainDetails({ resource, id, onSaved }: { resource: string; id: string; onSaved: () => void }) {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [row, setRow] = useState<Row | null>(null);
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState("");
  const load = useCallback(() => {
    Promise.all([schemaOf(resource), adminApi.get(resource, id)]).then(([s, r]) => { setSchema(s); setRow(r); }).catch((e) => setErr(e.message));
  }, [resource, id]);
  useEffect(load, [load]);
  if (err) return <p className="text-body-regular text-text-error-primary">{err}</p>;
  if (!schema || !row) return <Skeleton className="h-48 w-full rounded-2xl" />;
  const fields = schema.fields.filter((f) => !["id", "tenant", "created_at", "updated_at", "publish_at", "published_at"].includes(f.name));
  return (
    <section className="rounded-2xl border border-border-button-default bg-background-primary-default p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-headline-medium text-text-primary">Main details</h3>
        {schema.actions.update && <Button size="small" variant="secondary" leadingIcon={RiEditLine} onClick={() => setEditing(true)}>Edit details</Button>}
      </div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map((f) => (
          <div key={f.name} className="min-w-0">
            <dt className="text-caption-1-medium text-text-tertiary">{f.label}</dt>
            <dd className="min-w-0 break-words text-body-medium text-text-primary">
              {f.many ? ((row[f.name] || []) as string[]).map((v) => f.options?.find((o) => o.value === String(v))?.label ?? v).join(", ") || "—"
                : f.type === "file" && row[f.name] ? <a href={row[f.name]} target="_blank" rel="noopener noreferrer" className="underline">Open file</a>
                : f.type === "json" ? <span className="text-text-tertiary">{row[f.name] ? "Set" : "—"}</span>
                : <Cell field={f} value={row[f.name]} />}
            </dd>
          </div>
        ))}
      </dl>
      {editing && <RecordForm schema={schema} row={row} onClose={() => setEditing(false)}
        onSaved={() => { setEditing(false); toast("Saved", { status: "success" }); load(); onSaved(); }} />}
    </section>
  );
}

function DateChip({ active, label, note, onClick }: { active: boolean; label: string; note?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={cx("rounded-lg border px-3 py-1.5 text-body-medium transition-colors",
        active ? "border-text-primary bg-text-primary text-background-primary-default" : "border-border-button-default bg-background-primary-default text-text-secondary hover:text-text-primary")}>
      {label}{note && <span className={cx("ms-2", active ? "opacity-80" : "text-text-tertiary")}>{note}</span>}
    </button>
  );
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>;
}

/** Table in the same style as the rest of the admin; scrolls sideways on small screens. */
function SimpleTable({ head, rows, empty }: { head: string[]; rows: ReactNode[][]; empty: string }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border-button-default bg-background-primary-default shadow-xs">
      <table className="w-full min-w-[760px]">
        <thead>
          <tr className="border-b border-separator-border">
            {head.map((h, i) => <th key={i} scope="col" className="px-4 py-2.5 text-start text-caption-1-medium font-medium uppercase tracking-wide text-text-tertiary">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={head.length} className="px-4 py-12 text-center text-body-regular text-text-tertiary">{empty}</td></tr>}
          {rows.map((cells, i) => (
            <tr key={i} className="border-b border-separator-border transition-colors last:border-b-0 hover:bg-background-secondary-default/60">
              {cells.map((c, j) => <td key={j} className="px-4 py-3 align-middle text-body-medium text-text-primary">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BookingDetails({ reg, isTrip, onClose }: { reg: Reg; isTrip: boolean; onClose: () => void }) {
  const rows: [string, ReactNode][] = [
    ["Reference", reg.reference], ["Status", reg.status_label], ["Booked by", reg.name], ["Phone", reg.phone || "—"],
    ...(reg.email ? [["Email", reg.email] as [string, ReactNode]] : []),
    ["Date", when(reg.starts_at)], ["People", reg.participants], ["Total", money(reg.total)], ["Paid", money(reg.paid)], ["Due", money(reg.outstanding)],
    ...(!isTrip ? [["Hold until", when(reg.reserved_until)] as [string, ReactNode], ["UPI transaction ID", reg.payment_utr || "—"] as [string, ReactNode]] : []),
    ["Booked on", when(reg.created_at)],
  ];
  return (
    <Modal isOpen onOpenChange={(o) => !o && onClose()} size="md">
      {({ close }) => (
        <>
          <ModalHeader title={`Booking ${reg.reference}`} />
          <ModalBody>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              {rows.map(([k, v]) => (
                <div key={k}><dt className="text-caption-1-medium text-text-tertiary">{k}</dt><dd className="text-body-medium text-text-primary">{v}</dd></div>
              ))}
            </dl>
            {reg.customer_note && <p className="mt-4 whitespace-pre-wrap rounded-lg bg-background-secondary-default p-3 text-body-regular text-text-secondary">{reg.customer_note}</p>}
            {reg.payment_proof_url && (
              <a href={reg.payment_proof_url} target="_blank" rel="noopener noreferrer" className="mt-4 block w-fit">
                <p className="mb-1 text-caption-1-medium text-text-tertiary">Payment screenshot (opens full size)</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={reg.payment_proof_url} alt="Payment screenshot" className="max-h-96 rounded-lg border border-border-button-default object-contain" />
              </a>
            )}
          </ModalBody>
          <ModalFooter><Button variant="secondary" onClick={close}>Close</Button></ModalFooter>
        </>
      )}
    </Modal>
  );
}

/** Cash / bank transfer for one trip booking. The server checks the amount equals what is due, then a second staff member verifies it. */
export function RecordPaymentModal({ reg, onClose, onSave }: { reg: Reg; onClose: () => void; onSave: (body: unknown) => Promise<void> }) {
  const advanceDue = Number(reg.advance_due || 0);
  const options = [
    ...(advanceDue > 0 && advanceDue < Number(reg.outstanding) ? [{ kind: "ADVANCE", label: "Advance", amount: reg.advance_due! }] : []),
    { kind: Number(reg.paid) > 0 ? "BALANCE" : "FULL", label: Number(reg.paid) > 0 ? "Balance" : "Full amount", amount: reg.outstanding },
  ];
  const [kind, setKind] = useState(options[0].kind);
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const chosen = options.find((o) => o.kind === kind)!;
  return (
    <Modal isOpen onOpenChange={(o) => !o && onClose()} size="sm">
      {({ close }) => (
        <>
          <ModalHeader title={`Record payment for ${reg.reference}`} />
          <ModalBody>
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2" role="group" aria-label="What is being paid">
                {options.map((o) => (
                  <DateChip key={o.kind} active={kind === o.kind} onClick={() => setKind(o.kind)} label={o.label} note={money(o.amount)} />
                ))}
              </div>
              <p className="text-body-regular text-text-secondary">Amount received: <strong className="text-text-primary">{money(chosen.amount)}</strong></p>
              <Input label="Receipt / UTR / cash note *" value={reference} onChange={setReference} hint="Used to find this payment later. Must be unique." />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button variant="primary" disabled={!reference.trim() || busy} onClick={async () => {
              setBusy(true);
              try {
                await onSave({ checkout_id: reg.checkout_id, booking_ids: [reg.id], kind, amount: chosen.amount, reference: reference.trim() });
                close();
              } catch { setBusy(false); }
            }}>{busy ? "Saving…" : "Record payment"}</Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}
