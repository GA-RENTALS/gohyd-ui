"use client";
import { RiAddLine, RiBankLine, RiGroupLine, RiRoadMapLine, RiTicket2Line, RiTimeLine } from "@remixicon/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader, useAdmin } from "@/components/admin/Shell";
import { OrdersChartCard } from "@/components/application/dashboard/orders-chart-card";
import { RevenueChartCard } from "@/components/application/dashboard/revenue-chart-card";
import { StatCards, type Stat } from "@/components/application/dashboard/stat-cards";
import { Avatar } from "@/components/base/avatar/avatar";
import { Chip, type ChipColor } from "@/components/base/badges/chip";
import { ButtonLink } from "@/components/base/buttons/button";
import { RiAlertLine, RiInformationLine } from "@remixicon/react";
import { Skeleton } from "@/components/base/skeleton/skeleton";
import { adminApi, type Dashboard } from "@/lib/admin/api";
import { cx } from "@/utils/cx";

const ICON: Record<string, Stat["icon"]> = {
  trips: RiRoadMapLine, bookings: RiTicket2Line, revenue: RiBankLine, "pending-verification": RiTimeLine, customers: RiGroupLine,
};
const money = (v: string | number) => `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
function statusColor(s: string): ChipColor {
  const v = s.toUpperCase();
  if (/(CANCEL|FAIL|REJECT)/.test(v)) return "rose";
  if (/(PENDING|HOLD|DRAFT)/.test(v)) return "yellow";
  if (/(CONFIRM|PAID|COMPLETE)/.test(v)) return "lime";
  return "gray";
}

/** Placeholders and missing connections that would cause wrong invoices or silent failures, until someone fixes them. */
function SetupCard({ items }: { items: Dashboard["setup"] }) {
  if (!items?.length) return null;
  const [all, setAll] = useState(false);
  const warnings = items.filter((i) => i.severity === "warning").length;
  return (
    <section className="rounded-xl border border-border-button-default bg-background-primary-default p-4" aria-label="Finish setting up">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-headline-medium text-text-primary">Finish setting up</h2>
        <span className="text-body-regular text-text-secondary">{warnings ? `${warnings} need attention` : "Optional"}</span>
      </div>
      <ul className="flex flex-col">
        {items.map((i, index) => (
          <li key={i.key} className={cx("flex items-start gap-3 border-t border-separator-border py-2.5 first:border-t-0", !all && index >= 3 && "max-md:hidden")}>
            {i.severity === "warning"
              ? <RiAlertLine className="mt-0.5 size-5 shrink-0 text-accent-600" aria-hidden />
              : <RiInformationLine className="mt-0.5 size-5 shrink-0 text-foreground-icon-tertiary" aria-hidden />}
            <div className="min-w-0 flex-1">
              <p className="text-body-medium text-text-primary">{i.title}</p>
              <p className="text-body-regular text-text-secondary">{i.detail}</p>
            </div>
            {i.href && <Link href={i.href} className="shrink-0 text-body-medium text-text-secondary underline hover:text-text-primary">Open</Link>}
          </li>
        ))}
      </ul>
      {items.length > 3 && (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-1 w-full rounded-lg py-2 text-body-medium text-text-secondary hover:text-text-primary md:hidden">
          {all ? "Show fewer" : `Show ${items.length - 3} more`}
        </button>
      )}
    </section>
  );
}

export default function Home() {
  const { modules } = useAdmin();
  const [d, setD] = useState<Dashboard | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { adminApi.dashboard().then(setD).catch((e) => setErr(e.message)); }, []);
  const canViewBookings = !!modules.find((m) => m.key === "bookings")?.resources.some((r) => r.key === "bookings" && r.actions.view);
  const canViewSchedules = !!modules.find((m) => m.key === "trips")?.resources.some((r) => r.key === "trip-schedules" && r.actions.view);
  const canAddTrip = !!modules.find((m) => m.key === "trips")?.resources.some((r) => r.key === "trips" && r.actions.create);
  const canAddSchedule = !!modules.find((m) => m.key === "trips")?.resources.some((r) => r.key === "trip-schedules" && r.actions.create);
  const dashboardActions = canAddTrip ? (
    <ButtonLink href="/admin/trips/trips" variant="primary" leadingIcon={RiAddLine}>Add trip</ButtonLink>
  ) : undefined;

  const stats: Stat[] = (d?.cards ?? []).map((c) => ({
    icon: ICON[c.key] ?? RiRoadMapLine,
    label: c.label,
    value: c.key === "revenue" ? money(c.value) : Number(c.value).toLocaleString("en-IN"),
    delta: c.delta == null ? "" : `${c.delta > 0 ? "+" : ""}${c.delta}%`,
    deltaColor: c.delta == null || c.delta === 0 ? "neutral" : c.delta > 0 ? "lime" : "rose",
  }));

  return (
    <>
      <PageHeader crumbs={["Home"]} title="Admin overview" actions={dashboardActions} />
      {err && <p className="text-body-medium text-text-error-primary">{err}</p>}
      {!d && !err && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-[132px] w-full rounded-2xl" />
          <Skeleton className="h-[320px] w-full rounded-3xl" />
        </div>
      )}
      {d && (
        <div className="flex flex-col gap-3">
          <SetupCard items={d.setup} />
          {stats.length > 0 && <StatCards stats={stats} columns={stats.length >= 5 ? 5 : stats.length >= 4 ? 4 : stats.length >= 2 ? 2 : 1} />}
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {d.charts.revenue_monthly && <RevenueChartCard data={d.charts.revenue_monthly} title="Collected" />}
            {d.charts.bookings_monthly && <OrdersChartCard data={d.charts.bookings_monthly} title="Bookings" />}
          </div>
          {canViewBookings && (
            <section className="rounded-xl border border-border-button-default bg-background-primary-default p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-headline-medium text-text-primary">Recent bookings</h2>
                <Link href="/admin/bookings/bookings" className="text-body-medium text-text-secondary hover:text-text-primary">View all</Link>
              </div>
              {d.recent_bookings.length > 0 ? <ul className="flex flex-col gap-2">
                {d.recent_bookings.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-background-secondary-default">
                    <Avatar size="md" color="neutral" initials={(b.primary_booker__full_name || "?").slice(0, 2).toUpperCase()} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body-medium text-text-primary">{b.primary_booker__full_name || "Guest"}</p>
                      <p className="truncate text-body-regular text-text-secondary">{b.reference} · {b.schedule__trip__slug}</p>
                    </div>
                    <Chip variant="caption" color={statusColor(b.status)}>{b.status}</Chip>
                    <span className="w-24 text-end text-body-medium text-text-primary">{money(b.total_amount)}</span>
                  </li>
                ))}
              </ul> : <p className="py-5 text-center text-body-regular text-text-secondary">No bookings yet. New customer bookings will appear here.</p>}
            </section>
          )}
          {canViewSchedules && (
            <section className="rounded-xl border border-border-button-default bg-background-primary-default p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-headline-medium text-text-primary">Upcoming trips</h2>
                  <p className="text-body-regular text-text-secondary">Published trip dates that are open for booking.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Link href="/admin/trips/trip-schedules" className="text-body-medium text-text-secondary hover:text-text-primary">View all trip dates</Link>
                  {canAddTrip && (
                    <ButtonLink href="/admin/trips/trips" variant="secondary" leadingIcon={RiAddLine}>Add trip</ButtonLink>
                  )}
                </div>
              </div>
              {d.upcoming_trips.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {d.upcoming_trips.map((trip) => (
                    <li key={trip.id} className="flex flex-wrap items-center gap-3 rounded-lg p-2 hover:bg-background-secondary-default">
                      <Avatar size="md" color="neutral" initials={trip.trip__slug.slice(0, 2).toUpperCase()} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-body-medium text-text-primary">{trip.trip__slug.replaceAll("-", " ")}</p>
                        <p className="truncate text-body-regular text-text-secondary">{trip.seats_booked} of {trip.capacity} seats booked</p>
                      </div>
                      <span className="text-body-medium text-text-secondary">{new Date(trip.starts_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                      <Chip variant="caption" color="lime">Open for booking</Chip>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-lg bg-background-secondary-default px-4 py-6 text-center">
                  <p className="text-body-medium text-text-primary">No upcoming trips are open for booking</p>
                  <p className="mt-1 text-body-regular text-text-secondary">Add a trip or create a future trip date to make departures available to customers.</p>
                  {(canAddTrip || canAddSchedule) && (
                    <ButtonLink href={canAddTrip ? "/admin/trips/trips" : "/admin/trips/trip-schedules"} className="mt-3" variant="primary" leadingIcon={RiAddLine}>
                      {canAddTrip ? "Add trip" : "Add trip date"}
                    </ButtonLink>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </>
  );
}
