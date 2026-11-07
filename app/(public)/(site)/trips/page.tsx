import type { Metadata } from "next";
import { TripCard } from "@/components/booking/TripCard";
import { listTrips } from "@/lib/customer/server";
import type { TripSummary } from "@/lib/customer/types";

export const metadata: Metadata = {
  title: "Trips · GoHyderabad",
  description: "Weekend treks, rides, day trips and experiences around Hyderabad. Pick a date and book your spot.",
};
export const dynamic = "force-dynamic";

export default async function TripsPage() {
  let trips: TripSummary[] = [];
  let failed = false;
  try {
    trips = await listTrips();
  } catch {
    failed = true;
  }

  return (
    <div className="wrap">
      <div className="eyebrow">Book a spot</div>
      <h1 className="bk-title">Weekend <em>trips.</em></h1>
      <p className="bk-lede">Pick a plan, choose a date, and reserve your place. You pay a small advance now and the rest closer to the day.</p>

      {failed ? (
        <p className="bk-error" role="alert">We couldn't load the trips just now. Please try again in a moment.</p>
      ) : trips.length === 0 ? (
        <div className="bk-empty">
          <p>No trips are open for booking right now.</p>
          <p className="bk-note">New plans are announced on <a href="https://www.instagram.com/gohyderabad/" target="_blank" rel="noopener noreferrer">Instagram</a>.</p>
        </div>
      ) : (
        <div className="bk-grid">{trips.map((trip) => <TripCard key={trip.id} trip={trip} />)}</div>
      )}
    </div>
  );
}
