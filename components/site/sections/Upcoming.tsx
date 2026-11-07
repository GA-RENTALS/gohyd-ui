import { UpcomingCard } from "../UpcomingCard";
import { UPCOMING } from "../data/upcoming";

export function Upcoming() {
  return (
    <section className="intro on-light pad" id="about" aria-labelledby="intro-title">
      <div className="wrap">
        <div className="eyebrow" data-reveal="">01 · Upcoming</div>
        <div className="section-top" data-reveal="">
          <div>
            <h2 className="rail-title" id="intro-title">
              Upcoming
              {" "}
              <span>experiences</span>
            </h2>
            <p className="hint">A preview of what's coming up · sample content</p>
          </div>
          <div className="controls">
            <button className="arrow" type="button" data-target="upcomingRail" data-dir="-1" aria-label="Scroll upcoming left">‹</button>
            <button className="arrow" type="button" data-target="upcomingRail" data-dir="1" aria-label="Scroll upcoming right">›</button>
          </div>
        </div>
        <div className="rail" id="upcomingRail" tabIndex={0} aria-label="Upcoming experiences">
          {UPCOMING.map((card) => <UpcomingCard key={card.title} card={card} />)}
        </div>
        <p className="content-status" id="public-content-status" role="status" aria-live="polite" hidden />
      </div>
    </section>
  );
}
