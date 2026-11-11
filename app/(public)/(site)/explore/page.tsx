import { serverT } from "@/lib/lang-server";
import type { Metadata } from "next";
import Link from "next/link";
import { listExploreDestinations } from "@/lib/customer/public-content";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Explore Hyderabad",
  description: "Find Hyderabad landmarks, neighbourhoods and hidden city favourites with GoHyderabad.",
  path: "/explore",
});
export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const t = await serverT();
  let places = [] as Awaited<ReturnType<typeof listExploreDestinations>>;
  let failed = false;
  try { places = await listExploreDestinations(); } catch { failed = true; }
  return (
    <div className="wrap">
      <div className="eyebrow">{t("City favourites")}</div>
      <h1 className="bk-title">{t("h.explore.1")} <em>{t("h.explore.2")}</em></h1>
      <p className="bk-lede">{t("A few familiar corners and new-to-you places, gathered in one guide.")}</p>
      {failed ? <p className="bk-error" role="alert">{t("Places are unavailable right now. Please try again in a moment.")}</p> : places.length === 0 ? (
        <div className="bk-empty"><p>{t("Hyderabad place guides are coming soon.")}</p><p><Link href="/destinations">{t("Browse all destinations")}</Link></p></div>
      ) : (
        <div className="bk-grid">
          {places.map((place) => (
            <Link className="bk-trip" key={place.id} href={`/destinations/${place.slug}`}>
              <div className="bk-cover">{place.cover_url && <img src={place.cover_url} alt={place.name} loading="lazy" />}</div>
              <div className="bk-body"><div className="eyebrow">{place.region || t("Hyderabad")}</div><h2>{place.name}</h2>{place.summary && <p>{place.summary}</p>}<div className="bk-meta"><span>{t("Explore Hyderabad")}</span><span>{t("Read guide ↗")}</span></div></div>
            </Link>
          ))}
        </div>
      )}
      <p style={{ marginTop: 32 }}><Link href="/destinations">{t("Explore destinations beyond the city →")}</Link></p>
    </div>
  );
}
