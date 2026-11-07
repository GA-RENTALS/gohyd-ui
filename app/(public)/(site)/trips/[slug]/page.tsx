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

  return (
    <div className="wrap">
      <div className="eyebrow">Trip</div>
      <h1 className="bk-title">{trip.title || trip.slug}</h1>
      {trip.categories.length > 0 && <div className="bk-chips">{trip.categories.map((c) => <span key={c} className="bk-chip">{c.replace(/-/g, " ")}</span>)}</div>}

      <div className="bk-detail">
        <div>
          {trip.cover_url && <img className="bk-hero-img" src={trip.cover_url} alt="" />}
          {trip.summary && <p className="bk-lede" style={{ marginTop: 22 }}>{trip.summary}</p>}
          {facts.length > 0 && <p className="bk-note">{facts.join(" · ")}</p>}
          {trip.body && <div className="bk-card" style={{ marginTop: 24 }}><h2>About this trip</h2><div className="bk-prose">{trip.body}</div></div>}
          {trip.inclusions.length > 0 && <div className="bk-card"><h2>What's included</h2><ul className="bk-list">{trip.inclusions.map((i) => <li key={i}>{i}</li>)}</ul></div>}
          {trip.exclusions.length > 0 && <div className="bk-card"><h2>Not included</h2><ul className="bk-list">{trip.exclusions.map((i) => <li key={i}>{i}</li>)}</ul></div>}
          {trip.pickup_points.length > 0 && (
            <div className="bk-card">
              <h2>Pickup points</h2>
              <ul className="bk-list">{trip.pickup_points.map((p) => <li key={p.id}>{p.name}{p.pickup_time ? ` at ${p.pickup_time.slice(0, 5)}` : ""}{p.address ? `, ${p.address}` : ""}</li>)}</ul>
            </div>
          )}
          {tiers.length > 0 && <div className="bk-card"><h2>Cancellation &amp; refunds</h2><ul className="bk-list">{tiers.map((t) => <li key={t.days_before}>{refundText(t)}</li>)}</ul></div>}
        </div>
        <BookingPanel slug={trip.slug} schedules={trip.schedules} pickups={trip.pickup_points} isOpen={trip.operational_status === "OPEN"} />
      </div>
      {trip.operational_status === "OPEN" && trip.from_price !== null && trip.schedules.length > 0 && <MobileBookBar price={money(trip.from_price)} />}
    </div>
  );
}
