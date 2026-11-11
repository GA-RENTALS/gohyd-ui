import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingPanel } from "@/components/booking/BookingPanel";
import { MobileBookBar } from "@/components/booking/MobileBookBar";
import { money } from "@/lib/customer/format";
import { getTrip } from "@/lib/customer/server";
import type { RefundTier } from "@/lib/customer/types";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getTrip(slug).catch(() => null);
  if (!trip) return { title: "Trip not found · GoHyderabad" };
  return {
    title: `${trip.title || slug} · GoHyderabad`,
    description: trip.summary || undefined,
    openGraph: { title: trip.title || slug, description: trip.summary || undefined, images: trip.cover_url ? [trip.cover_url] : undefined },
  };
}

const refundText = (tier: RefundTier) =>
  `${tier.refund_basis_points / 100}% refund if you cancel ${tier.days_before} or more days before the trip${tier.note ? ` (${tier.note})` : ""}`;

export default async function TripPage({ params }: Props) {
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
    { id: "trip-about", label: "About" },
    { id: "trip-itinerary", label: "Itinerary" },
    { id: "trip-bring", label: "Things to bring" },
    { id: "trip-includes", label: "Includes" },
    { id: "trip-excludes", label: "Excludes" },
  ];

  return (
    <div className="wrap">
      <div className="eyebrow">Trip</div>
      <h1 className="bk-title">{trip.title || trip.slug}</h1>
      {trip.categories.length > 0 && <div className="bk-chips">{trip.categories.map((c) => <span key={c} className="bk-chip">{c.replace(/-/g, " ")}</span>)}</div>}

      <nav className="bk-section-tabs" aria-label="Trip details">
        {sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.label}</a>)}
      </nav>

      <div className="bk-detail">
        <div className="bk-detail-content">
          <section className="bk-card bk-detail-section" id="trip-about" aria-labelledby="trip-about-title">
            <h2 id="trip-about-title">About this trip</h2>
            {trip.cover_url && <img className="bk-hero-img" src={trip.cover_url} alt={trip.title ? `${trip.title} trip` : ""} />}
            {trip.summary && <p className="bk-lede" style={{ marginTop: 18 }}>{trip.summary}</p>}
            {facts.length > 0 && <p className="bk-note">{facts.join(" · ")}</p>}
            {trip.body && <div className="bk-prose">{trip.body}</div>}
          </section>

          <section className="bk-card bk-detail-section" id="trip-itinerary" aria-labelledby="trip-itinerary-title">
            <h2 id="trip-itinerary-title">Itinerary</h2>
            {trip.itineraries.length > 0 ? (
              <div className="bk-itinerary">
                {trip.itineraries.map((day) => (
                  <article key={day.id} className="bk-itinerary-day">
                    <h3>{day.title || `Day ${day.day_number}`}</h3>
                    {day.items.length > 0 ? (
                      <ol className="bk-itinerary-list">
                        {day.items.map((item) => <li key={item.id}><span>{item.time_label || "Plan"}</span><p>{item.text}</p></li>)}
                      </ol>
                    ) : <p className="bk-note">Details will be shared before departure.</p>}
                  </article>
                ))}
              </div>
            ) : <p className="bk-note">The itinerary will be shared before departure.</p>}
          </section>

          <section className="bk-card bk-detail-section" id="trip-bring" aria-labelledby="trip-bring-title">
            <h2 id="trip-bring-title">Things to bring</h2>
            {trip.things_to_bring.length > 0
              ? <ul className="bk-list">{trip.things_to_bring.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
              : <p className="bk-note">A packing list will be shared before departure.</p>}
          </section>

          <section className="bk-card bk-detail-section" id="trip-includes" aria-labelledby="trip-includes-title">
            <h2 id="trip-includes-title">What's included</h2>
            {trip.inclusions.length > 0 ? <ul className="bk-list">{trip.inclusions.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="bk-note">Inclusions will be confirmed before booking.</p>}
          </section>

          <section className="bk-card bk-detail-section" id="trip-excludes" aria-labelledby="trip-excludes-title">
            <h2 id="trip-excludes-title">What's not included</h2>
            {trip.exclusions.length > 0 ? <ul className="bk-list">{trip.exclusions.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="bk-note">Exclusions will be confirmed before booking.</p>}
          </section>

          {trip.pickup_points.length > 0 && (
            <section className="bk-card bk-detail-section" aria-labelledby="trip-pickups-title">
              <h2 id="trip-pickups-title">Pickup points</h2>
              <ul className="bk-list">{trip.pickup_points.map((p) => <li key={p.id}>{p.name}{p.pickup_time ? ` at ${p.pickup_time.slice(0, 5)}` : ""}{p.address ? `, ${p.address}` : ""}</li>)}</ul>
            </section>
          )}
          {tiers.length > 0 && <section className="bk-card bk-detail-section" aria-labelledby="trip-cancel-title"><h2 id="trip-cancel-title">Cancellation &amp; refunds</h2><ul className="bk-list">{tiers.map((t) => <li key={t.days_before}>{refundText(t)}</li>)}</ul></section>}
        </div>
        <BookingPanel slug={trip.slug} schedules={trip.schedules} pickups={trip.pickup_points} isOpen={trip.operational_status === "OPEN"} />
      </div>
      {trip.operational_status === "OPEN" && trip.from_price !== null && trip.schedules.length > 0 && <MobileBookBar price={money(trip.from_price)} />}
    </div>
  );
}
