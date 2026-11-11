import { serverT } from "@/lib/lang-server";
import type { Metadata } from "next";
import Link from "next/link";
import { listDestinations } from "@/lib/customer/public-content";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Places to Explore Around Hyderabad",
  description: "Discover Hyderabad landmarks, neighbourhoods and weekend escapes with GoHyderabad.",
  path: "/destinations",
});
export const dynamic = "force-dynamic";

export default async function DestinationsPage() {
  const t = await serverT();
  let destinations = [] as Awaited<ReturnType<typeof listDestinations>>;
  let failed = false;
  try { destinations = await listDestinations(); } catch { failed = true; }

  return (
    <div className="wrap">
      <div className="eyebrow">{t("The city and beyond")}</div>
      <h1 className="bk-title">{t("h.dest.1")} <em>{t("h.dest.2")}</em></h1>
      <p className="bk-lede">{t("Find a new favourite close to home or a little further out.")}</p>
      {failed ? <p className="bk-error" role="alert">{t("Places are unavailable right now. Please try again in a moment.")}</p> : destinations.length === 0 ? (
        <div className="bk-empty"><p>{t("Destination guides are coming soon.")}</p><p><Link href="/trips">{t("Browse upcoming trips")}</Link></p></div>
      ) : (
        <div className="bk-grid">
          {destinations.map((place) => (
            <Link className="bk-trip" key={place.id} href={`/destinations/${place.slug}`}>
              <div className="bk-cover">{place.cover_url && <img src={place.cover_url} alt={place.name} loading="lazy" />}</div>
              <div className="bk-body">
                <div className="eyebrow">{place.region || t("Hyderabad")}</div>
                <h2>{place.name}</h2>
                {place.summary && <p>{place.summary}</p>}
                <div className="bk-meta"><span>{t("Explore place")}</span><span>{t("Read guide ↗")}</span></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
