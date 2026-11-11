import { serverT } from "@/lib/lang-server";
import type { Metadata } from "next";
import Link from "next/link";
import { listEvents } from "@/lib/customer/public-content";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({ title: "Experiences in Hyderabad", description: "Find local events, outdoor adventures and things to do with GoHyderabad.", path: "/experiences" });
export const dynamic = "force-dynamic";

export default async function ExperiencesPage() {
  const t = await serverT();
  let events = [] as Awaited<ReturnType<typeof listEvents>>;
  let failed = false;
  try { events = await listEvents(); } catch { failed = true; }
  return (
    <div className="wrap">
      <div className="eyebrow">{t("Meet your kind of people")}</div>
      <h1 className="bk-title">{t("h.xp.1")} <em>{t("h.xp.2")}</em></h1>
      <p className="bk-lede">{t("From city favourites to time outdoors, find something good to do together.")}</p>
      {failed ? <p className="bk-error" role="alert">{t("Experiences are unavailable right now. Please try again in a moment.")}</p> : events.length === 0 ? (
        <div className="bk-empty"><p>{t("New experiences are being planned.")}</p><p><Link href="/trips">{t("See upcoming trips")}</Link></p></div>
      ) : (
        <div className="bk-grid">
          {events.map((event) => (
            <Link className="bk-trip" key={event.id} href={`/events/${event.slug}`}>
              <div className="bk-cover">{event.cover_url && <img src={event.cover_url} alt={event.title} loading="lazy" />}</div>
              <div className="bk-body"><div className="eyebrow">{event.next_date ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(event.next_date)) : t("GoHyderabad experience")}</div><h2>{event.title}</h2>{event.summary && <p>{event.summary}</p>}<div className="bk-meta"><span>{t("Details & booking")}</span><span>↗</span></div></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
