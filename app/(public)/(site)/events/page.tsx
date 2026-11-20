import { serverT } from "@/lib/lang-server";
import type { Metadata } from "next";
import Link from "next/link";
import { listEvents } from "@/lib/customer/public-content";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({ title: "Upcoming events in Hyderabad", description: "GoHyderabad events with a date: book your place and pay online.", path: "/events" });
export const dynamic = "force-dynamic";

const day = (iso: string) => new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(iso));

/** Events with an upcoming date, soonest first. Experiences without a date yet are on /experiences. */
export default async function EventsPage() {
  const t = await serverT();
  let events = [] as Awaited<ReturnType<typeof listEvents>>;
  let failed = false;
  try { events = await listEvents(); } catch { failed = true; }
  const upcoming = events.filter((e) => e.next_date).sort((a, b) => +new Date(a.next_date!) - +new Date(b.next_date!));
  return (
    <div className="wrap">
      <div className="eyebrow">{t("Meet your kind of people")}</div>
      <h1 className="bk-title">{t("Upcoming events")}</h1>
      <p className="bk-lede">{t("Pick a date, book your place and pay online. Bring your friends along.")}</p>
      {failed ? <p className="bk-error" role="alert">{t("Experiences are unavailable right now. Please try again in a moment.")}</p> : upcoming.length === 0 ? (
        <div className="bk-empty"><p>{t("No dates announced right now.")}</p><p><Link href="/experiences">{t("See all experiences")}</Link></p></div>
      ) : (
        <div className="bk-grid">
          {upcoming.map((event) => (
            <Link className="bk-trip" key={event.id} href={`/events/${event.slug}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="bk-cover">{event.cover_url && <img src={event.cover_url} alt={event.title} loading="lazy" />}</div>
              <div className="bk-body"><div className="eyebrow">{day(event.next_date!)}</div><h2>{event.title}</h2>{event.summary && <p>{event.summary}</p>}<div className="bk-meta"><span>{t("Details & booking")}</span><span>↗</span></div></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
