import { serverT } from "@/lib/lang-server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingPanel } from "@/components/booking/BookingPanel";
import { MobileBookBar } from "@/components/booking/MobileBookBar";
import { money } from "@/lib/customer/format";
import { getTrip } from "@/lib/customer/server";
import type { RefundTier, TripDetail } from "@/lib/customer/types";
import { SITE_NAME, SITE_URL, absoluteUrl, jsonLd, metaDescription, pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getTrip(slug).catch(() => null);
  if (!trip) return { title: "Trip not found", robots: { index: false } };
  return pageMetadata({
    title: trip.seo_title || `${trip.title || slug} — Trip from Hyderabad`,
    description: metaDescription(trip.seo_description, trip.summary, trip.body),
    path: `/trips/${trip.slug}`,
    image: trip.cover_url,
    imageAlt: trip.title,
  });
}

/** schema.org TouristTrip with one Offer per open departure (price, seats, booking URL). */
function tripJsonLd(trip: TripDetail) {
  const url = `${SITE_URL}/trips/${trip.slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: trip.title || trip.slug,
      description: metaDescription(trip.summary, trip.body),
      url,
      ...(trip.cover_url ? { image: [absoluteUrl(trip.cover_url)] } : {}),
      touristType: trip.categories.map((c) => c.replace(/-/g, " ")),
      provider: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL },
      ...(trip.itineraries.length ? {
        itinerary: {
          "@type": "ItemList",
          itemListElement: trip.itineraries.flatMap((day) => day.items).map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.text })),
        },
      } : {}),
      offers: trip.schedules.map((s) => ({
        "@type": "Offer",
        url,
        price: Number(s.price_per_participant).toFixed(2),
        priceCurrency: s.currency || "INR",
        availability: s.is_open && s.seats_left > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
        availabilityEnds: s.starts_at,
        validFrom: undefined,
        eligibleQuantity: { "@type": "QuantitativeValue", maxValue: s.seats_left },
        description: `Departure ${s.starts_at.slice(0, 10)}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Trips", item: `${SITE_URL}/trips` },
        { "@type": "ListItem", position: 3, name: trip.title || trip.slug, item: url },
      ],
    },
  ];
}

const refundText = (tier: RefundTier) =>
  `${tier.refund_basis_points / 100}% refund if you cancel ${tier.days_before} or more days before the trip${tier.note ? ` (${tier.note})` : ""}`;

export default async function TripPage({ params }: Props) {
  const t = await serverT();
  const { slug } = await params;
  const trip = await getTrip(slug).catch(() => { throw new Error("The trip could not be loaded."); });
  if (!trip) notFound();

  const facts = [
    trip.duration_hours ? `${trip.duration_hours} hours` : null,
    trip.difficulty ? trip.difficulty.toLowerCase() : null,
    trip.min_age ? `ages ${trip.min_age}+` : null,
  ].filter(Boolean) as string[];
  const tiers = [...trip.policies].sort((a, b) => b.days_before - a.days_before);
  const sections = [
    { id: "trip-about", label: t("tab.about") },
    { id: "trip-itinerary", label: t("Itinerary") },
    { id: "trip-bring", label: t("Things to bring") },
    { id: "trip-includes", label: t("Includes") },
    { id: "trip-excludes", label: t("Excludes") },
  ];

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(tripJsonLd(trip)) }} />
      <div className="eyebrow">{t("Trip")}</div>
      <h1 className="bk-title">{trip.title || trip.slug}</h1>
      {trip.categories.length > 0 && <div className="bk-chips">{trip.categories.map((c) => <span key={c} className="bk-chip">{c.replace(/-/g, " ")}</span>)}</div>}

      <nav className="bk-section-tabs" aria-label="Trip details">
        {sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.label}</a>)}
      </nav>

      <div className="bk-detail">
        <div className="bk-detail-content">
          <section className="bk-card bk-detail-section" id="trip-about" aria-labelledby="trip-about-title">
            <h2 id="trip-about-title">{t("About this trip")}</h2>
            {trip.cover_url && <img className="bk-hero-img" src={trip.cover_url} alt={trip.title ? `${trip.title} trip` : ""} />}
            {trip.summary && <p className="bk-lede" style={{ marginTop: 18 }}>{trip.summary}</p>}
            {facts.length > 0 && <p className="bk-note">{facts.join(" · ")}</p>}
            {trip.body && <div className="bk-prose">{trip.body}</div>}
          </section>

          <section className="bk-card bk-detail-section" id="trip-itinerary" aria-labelledby="trip-itinerary-title">
            <h2 id="trip-itinerary-title">{t("Itinerary")}</h2>
            {trip.itineraries.length > 0 ? (
              <div className="bk-itinerary">
                {trip.itineraries.map((day) => (
                  <article key={day.id} className="bk-itinerary-day">
                    <h3>{day.title || `Day ${day.day_number}`}</h3>
                    {day.items.length > 0 ? (
                      <ol className="bk-itinerary-list">
                        {day.items.map((item) => <li key={item.id}><span>{item.time_label || t("Plan")}</span><p>{item.text}</p></li>)}
                      </ol>
                    ) : <p className="bk-note">{t("Details will be shared before departure.")}</p>}
                  </article>
                ))}
              </div>
            ) : <p className="bk-note">{t("The itinerary will be shared before departure.")}</p>}
          </section>

          <section className="bk-card bk-detail-section" id="trip-bring" aria-labelledby="trip-bring-title">
            <h2 id="trip-bring-title">{t("Things to bring")}</h2>
            {trip.things_to_bring.length > 0
              ? <ul className="bk-list">{trip.things_to_bring.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
              : <p className="bk-note">{t("A packing list will be shared before departure.")}</p>}
          </section>

          <section className="bk-card bk-detail-section" id="trip-includes" aria-labelledby="trip-includes-title">
            <h2 id="trip-includes-title">{t("What's included")}</h2>
            {trip.inclusions.length > 0 ? <ul className="bk-list">{trip.inclusions.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="bk-note">{t("Inclusions will be confirmed before booking.")}</p>}
          </section>

          <section className="bk-card bk-detail-section" id="trip-excludes" aria-labelledby="trip-excludes-title">
            <h2 id="trip-excludes-title">{t("What's not included")}</h2>
            {trip.exclusions.length > 0 ? <ul className="bk-list">{trip.exclusions.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="bk-note">{t("Exclusions will be confirmed before booking.")}</p>}
          </section>

          {trip.pickup_points.length > 0 && (
            <section className="bk-card bk-detail-section" aria-labelledby="trip-pickups-title">
              <h2 id="trip-pickups-title">{t("Pickup points")}</h2>
              <ul className="bk-list">{trip.pickup_points.map((p) => <li key={p.id}>{p.name}{p.pickup_time ? ` at ${p.pickup_time.slice(0, 5)}` : ""}{p.address ? `, ${p.address}` : ""}</li>)}</ul>
            </section>
          )}
          {tiers.length > 0 && <section className="bk-card bk-detail-section" aria-labelledby="trip-cancel-title"><h2 id="trip-cancel-title">{t("Cancellation & refunds")}</h2><ul className="bk-list">{tiers.map((t) => <li key={t.days_before}>{refundText(t)}</li>)}</ul></section>}
        </div>
        <BookingPanel slug={trip.slug} schedules={trip.schedules} pickups={trip.pickup_points} isOpen={trip.operational_status === "OPEN"} />
      </div>
      {trip.operational_status === "OPEN" && trip.from_price !== null && trip.schedules.length > 0 && <MobileBookBar price={money(trip.from_price)} />}
    </div>
  );
}
