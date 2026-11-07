import Link from "next/link";
import { longDate, money } from "@/lib/customer/format";
import type { TripSummary } from "@/lib/customer/types";

export function TripCard({ trip }: { trip: TripSummary }) {
  return (
    <Link href={`/trips/${trip.slug}`} className="bk-trip">
      <div className="bk-cover">
        {trip.cover_url && <img src={trip.cover_url} alt="" loading="lazy" decoding="async" />}
      </div>
      <div className="bk-body">
        {trip.categories.length > 0 && <span className="bk-chip" style={{ alignSelf: "flex-start" }}>{trip.categories[0].replace(/-/g, " ")}</span>}
        <h3>{trip.title || trip.slug}</h3>
        {trip.summary && <p>{trip.summary}</p>}
        <div className="bk-meta">
          <span>{trip.next_departure ? longDate(trip.next_departure) : "Dates announced soon"}</span>
          {trip.from_price !== null && <span>From {money(trip.from_price)}</span>}
        </div>
      </div>
    </Link>
  );
}
