import { Icon } from "../Icon";
import { PlanCard } from "../PlanCard";
import { FEATURED_EVENT_PLAN } from "../data/featured-event";

/**
 * Upcoming events. Server-rendered with the local Box Cricket fallback; publicContent.ts replaces the rail with
 * every published Event from the backend that has a future date.
 */
export function Events() {
  return (
    <section className="events on-light pad" id="events" aria-labelledby="events-title">
      <div className="wrap">
        <div className="ev-head" data-reveal="">
          <div>
            <div className="eyebrow">01 · Upcoming events</div>
            <h2 className="h-section" id="events-title">
              Make room
              <br />
              for
              {" "}
              <em>the weekend.</em>
            </h2>
            <p className="count-line" id="events-count">1 upcoming event in Hyderabad</p>
          </div>
          <p className="lede">
            Find your next reason to step out. Pick an event, book your spot, and let the weekend take shape.
          </p>
        </div>
        <p className="notice" data-reveal="">
          <Icon name="info" />
          <span>
            <strong>Book in a minute.</strong>
            {" "}
            Open an event to see the details and send your booking request. Our team will confirm your place on WhatsApp or a call.
          </span>
        </p>
        <div className="section-top" data-reveal="">
          <div>
            <h2 className="rail-title">
              Upcoming
              {" "}
              <span>events</span>
            </h2>
            <p className="hint">Dates, prices and slots for what's coming up next</p>
          </div>
          <div className="controls">
            <button className="arrow" type="button" data-target="ev-grid" data-dir="-1" aria-label="Scroll events left">‹</button>
            <button className="arrow" type="button" data-target="ev-grid" data-dir="1" aria-label="Scroll events right">›</button>
          </div>
        </div>
        <div className="rail ev-rail" id="ev-grid" aria-live="polite" tabIndex={0} aria-label="Upcoming events">
          <PlanCard plan={FEATURED_EVENT_PLAN} />
        </div>
        <p className="content-status" id="public-content-status" role="status" aria-live="polite" hidden />
      </div>
    </section>
  );
}
