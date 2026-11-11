import { serverT } from "@/lib/lang-server";
import type { Metadata } from "next";
import { TripCard } from "@/components/booking/TripCard";
import { listTrips } from "@/lib/customer/server";
import { pageMetadata } from "@/lib/site";
import type { TripSummary } from "@/lib/customer/types";

export const metadata: Metadata = pageMetadata({
  title: "Weekend Trips from Hyderabad — Treks, Rides & Day Trips",
  description: "Book weekend treks, bike rides, day trips and getaways from Hyderabad. See dates, prices and seats left, pay a small advance, and travel with the GoHyderabad community.",
  path: "/trips",
});
export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const t = await serverT();
  let trips: TripSummary[] = [];
  let failed = false;
  try {
    trips = await listTrips();
  } catch {
    failed = true;
  }

  return (
    <div className="wrap">
      <div className="eyebrow">{t("Book a spot")}</div>
      <h1 className="bk-title">{t("h.trips.1")} <em>{t("h.trips.2")}</em></h1>
      <p className="bk-lede">{t("Pick a plan, choose a date, and reserve your place. You pay a small advance now and the rest closer to the day.")}</p>

      {failed ? (
        <p className="bk-error" role="alert">{t("We couldn't load the trips just now. Please try again in a moment.")}</p>
      ) : trips.length === 0 ? (
        <div className="bk-empty">
          <p>{t("No trips are open for booking right now.")}</p>
          <p className="bk-note">New plans are announced on <a href="https://www.instagram.com/gohyderabad/" target="_blank" rel="noopener noreferrer">Instagram</a>.</p>
        </div>
      ) : (
        <div className="bk-grid">{trips.map((trip) => <TripCard key={trip.id} trip={trip} />)}</div>
      )}
    </div>
  );
}
