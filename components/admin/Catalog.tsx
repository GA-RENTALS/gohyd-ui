"use client";
import { RiAddLine, RiCalendarLine, RiImageLine, RiSearchLine } from "@remixicon/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { schemaOf } from "@/components/admin/RelatedList";
import { RecordForm } from "@/components/admin/ResourceView";
import { PageTitle } from "@/components/admin/ui";
import { Chip } from "@/components/base/badges/chip";
import { Button } from "@/components/base/buttons/button";
import { InputBase } from "@/components/base/input/input";
import { Skeleton } from "@/components/base/skeleton/skeleton";
import { toast } from "@/components/base/toast/toast";
import { adminApi, type CatalogItem, type Schema } from "@/lib/admin/api";

const money = (v: string | number) => `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const day = (v: string) => new Date(v).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

/** Trips or events as cards. Clicking a card opens its page with everything about it. */
export function Catalog({ kind }: { kind: "trip" | "event" }) {
  const router = useRouter();
  const plural = kind === "trip" ? "trips" : "events";
  const Title = kind === "trip" ? "Trips" : "Events";
  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState<Schema | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      adminApi.catalog(plural, search).then((d) => { setItems(d.results); setCanCreate(d.can_create); setErr(""); }).catch((e) => setErr(e.message));
    }, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [plural, search]);

  const add = () => schemaOf(plural).then(setCreating).catch((e) => toast(e.message, { status: "error" }));
  // "New trip" / "New event" on the dashboard links here with ?new=1
  useEffect(() => { if (new URLSearchParams(window.location.search).get("new") === "1") add(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <PageTitle title={Title} sub={kind === "trip" ? "Click a trip to see its bookings, payments, dates and content in one place." : "Click an event to see its bookings, payment proofs, dates and content in one place."}
        actions={canCreate ? <Button variant="primary" leadingIcon={RiAddLine} onClick={add}>Add {kind}</Button> : null} />

      <InputBase aria-label={`Search ${plural}`} placeholder={`Search ${plural}`} leadingIcon={RiSearchLine} value={search}
        onChange={(e) => setSearch(e.target.value)}
        fieldClassName="mb-5 w-full rounded-lg border border-border-button-default bg-background-primary-default sm:w-[320px]" className="text-body-medium" />

      {err && <p className="py-10 text-center text-body-medium text-text-error-primary">{err}</p>}
      {!items && !err && <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}</div>}
      {items?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border-button-default py-16 text-center">
          <p className="text-body-medium text-text-primary">{search ? `No ${plural} match “${search}”.` : `No ${plural} yet.`}</p>
          {canCreate && !search && <Button className="mt-3" variant="primary" leadingIcon={RiAddLine} onClick={add}>Add your first {kind}</Button>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items?.map((t) => {
          const full = t.next_capacity ? Math.min(100, Math.round(((t.next_booked ?? 0) / t.next_capacity) * 100)) : 0;
          return (
            <Link key={t.id} href={`/admin/overview/${kind}/${t.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border-button-default bg-background-primary-default transition-shadow hover:shadow-md">
              <div className="relative aspect-[16/8] bg-background-secondary-default">
                {t.cover_url
                  ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={t.cover_url} alt="" className="size-full object-cover" />
                  : <div className="grid size-full place-items-center text-foreground-icon-tertiary"><RiImageLine className="size-8" aria-hidden /></div>}
                <div className="absolute start-3 top-3 flex gap-1.5">
                  <Chip variant="caption" color={t.status === "PUBLISHED" ? "lime" : "yellow"}>{t.status === "PUBLISHED" ? "Live" : t.status.toLowerCase()}</Chip>
                  {t.operational_label && t.operational_label !== "Open for booking" && <Chip variant="caption" color="gray">{t.operational_label}</Chip>}
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <h2 className="text-headline-medium text-text-primary group-hover:underline">{t.title}</h2>
                  <p className="mt-0.5 flex items-center gap-1.5 text-body-regular text-text-secondary">
                    <RiCalendarLine className="size-4" aria-hidden />
                    {t.next_date ? `Next: ${day(t.next_date)}` : t.dates ? "No upcoming dates" : "No dates yet"}
                    {Number(t.price) > 0 && <span>· {money(t.price)} / person</span>}
                  </p>
                </div>
                {t.next_capacity != null && (
                  <div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-background-secondary-default">
                      <div className="h-full rounded-full bg-text-primary" style={{ width: `${full}%` }} />
                    </div>
                    <p className="mt-1 text-caption-1-medium text-text-tertiary">{t.next_booked ?? 0} of {t.next_capacity} seats taken on the next date</p>
                  </div>
                )}
                <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-separator-border pt-3 text-center">
                  <div><dt className="text-caption-1-medium text-text-tertiary">Bookings</dt><dd className="text-body-medium text-text-primary">{t.bookings}</dd></div>
                  <div><dt className="text-caption-1-medium text-text-tertiary">Awaiting pay</dt><dd className={t.pending ? "text-body-medium text-text-error-primary" : "text-body-medium text-text-primary"}>{t.pending}</dd></div>
                  <div><dt className="text-caption-1-medium text-text-tertiary">Revenue</dt><dd className="text-body-medium text-text-primary">{money(t.revenue)}</dd></div>
                </dl>
              </div>
            </Link>
          );
        })}
      </div>

      {creating && (
        <RecordForm schema={creating} row={null} onClose={() => setCreating(null)}
          onSaved={(saved) => { setCreating(null); toast(`${kind === "trip" ? "Trip" : "Event"} created. Add its title, dates and details here.`, { status: "success" }); if (saved?.id) router.push(`/admin/overview/${kind}/${saved.id}?tab=details`); }} />
      )}
    </>
  );
}
