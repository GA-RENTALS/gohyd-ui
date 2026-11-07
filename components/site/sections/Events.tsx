import { Icon } from "../Icon";
import { PlanCard } from "../PlanCard";
import { PLANS } from "../data/plans";

export function Events() {
  return (
    <section className="events on-light pad" id="events" aria-labelledby="events-title">
      <div className="wrap">
        <div className="ev-head" data-reveal="">
          <div>
            <div className="eyebrow">03 · What's next</div>
            <h2 className="h-section" id="events-title">
              Make room
              <br />
              for
              {" "}
              <em>the weekend.</em>
            </h2>
            <p className="count-line">53 escapes around Hyderabad</p>
          </div>
          <p className="lede">
            Find your next reason to step out. Pick a plan, bring your curiosity, and let the weekend take shape.
          </p>
        </div>
        <p className="notice" data-reveal="">
          <Icon name="info" />
          <span>
            <strong>These are plan formats, not a live schedule.</strong>
            {" "}
            Dates, times, prices and availability change with every announcement and are posted on Instagram, so we don't list them here rather than risk showing you something out of date.
          </span>
        </p>
        <div className="section-top" data-reveal="">
          <div>
            <h2 className="rail-title">
              Explore all
              {" "}
              <span>50 plans</span>
            </h2>
            <p className="hint">From quick city escapes to full weekend adventures</p>
          </div>
          <div className="controls">
            <button className="arrow" type="button" data-target="ev-grid" data-dir="-1" aria-label="Scroll plans left">‹</button>
            <button className="arrow" type="button" data-target="ev-grid" data-dir="1" aria-label="Scroll plans right">›</button>
          </div>
        </div>
        <div className="chips" role="group" aria-label="Filter plans by category" data-reveal="">
          <button className="chip" type="button" data-chip="all" aria-pressed="true">All</button>
          {" "}
          <button className="chip" type="button" data-chip="trekking" aria-pressed="false">Trekking</button>
          {" "}
          <button className="chip" type="button" data-chip="forts" aria-pressed="false">Forts</button>
          {" "}
          <button className="chip" type="button" data-chip="day-trips" aria-pressed="false">Day Trips</button>
          {" "}
          <button className="chip" type="button" data-chip="camping" aria-pressed="false">Camping</button>
          {" "}
          <button className="chip" type="button" data-chip="rides" aria-pressed="false">Rides</button>
          {" "}
          <button className="chip" type="button" data-chip="lakes" aria-pressed="false">Lakes</button>
          {" "}
          <button className="chip" type="button" data-chip="adventure" aria-pressed="false">Adventure</button>
          {" "}
          <button className="chip" type="button" data-chip="wildlife" aria-pressed="false">Wildlife</button>
          {" "}
          <button className="chip" type="button" data-chip="waterfalls" aria-pressed="false">Waterfalls</button>
          {" "}
          <button className="chip" type="button" data-chip="temples" aria-pressed="false">Temples</button>
          {" "}
          <button className="chip" type="button" data-chip="viewpoints" aria-pressed="false">Viewpoints</button>
        </div>
        <div className="rail ev-rail" id="ev-grid" aria-live="polite" tabIndex={0} aria-label="Plan formats">
          {PLANS.map((plan) => <PlanCard key={plan.title} plan={plan} />)}
        </div>
      </div>
    </section>
  );
}
