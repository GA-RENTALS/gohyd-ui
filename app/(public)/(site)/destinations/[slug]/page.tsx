import { serverT } from "@/lib/lang-server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { contentText, getDestination, type PublicDestination } from "@/lib/customer/public-content";
import { metaDescription, pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const place = await getDestination(slug);
    if (place) return pageMetadata({
      title: place.seo.title || place.name,
      description: metaDescription(place.seo.description, place.summary),
      path: `/destinations/${encodeURIComponent(slug)}`,
      image: place.cover_url,
    });
  } catch {}
  return pageMetadata({ title: "Destination guide", path: `/destinations/${encodeURIComponent(slug)}` });
}

export default async function DestinationDetailPage({ params }: Props) {
  const t = await serverT();
  const { slug } = await params;
  let place: PublicDestination | null = null;
  let failed = false;
  try { place = await getDestination(slug); } catch { failed = true; }
  if (!place && !failed) notFound();
  if (failed) return <div className="wrap"><p className="bk-error" role="alert">This place is temporarily unavailable. Please try again in a moment.</p></div>;
  if (!place) notFound();

  return (
    <article className="wrap">
      <div className="eyebrow"><Link href="/destinations">{t("Places")}</Link> / {place.region}</div>
      <h1 className="bk-title">{place.name}</h1>
      {place.cover_url && <img className="bk-hero-img" src={place.cover_url} alt={place.name} />}
      {place.summary && <p className="bk-lede">{place.summary}</p>}
      {place.body && <div className="bk-card bk-prose">{contentText(place.body)}</div>}
      <p className="bk-btn-row" style={{ marginTop: 24 }}><Link className="btn" href="/trips">{t("Find a trip nearby")}</Link><Link href="/destinations">{t("All places")}</Link></p>
    </article>
  );
}
