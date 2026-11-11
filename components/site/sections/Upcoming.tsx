import { serverT } from "@/lib/lang-server";
/**
 * Upcoming trips. Hidden until publicContent.ts finds a published trip with a future departure;
 * there are no sample cards any more.
 */
export async function Upcoming() {
  const t = await serverT();
  return (
    <section className="intro on-light pad" id="upcoming-trips" aria-labelledby="intro-title" hidden>
      <div className="wrap">
        <div className="eyebrow" data-reveal="">{t("03 · Upcoming trips")}</div>
        <div className="section-top" data-reveal="">
          <div>
            <h2 className="rail-title" id="intro-title">
              {t("Upcoming")}
              {" "}
              <span>{t("trips")}</span>
            </h2>
            <p className="hint">{t("Published trips with open departures")}</p>
          </div>
          <div className="controls">
            <button className="arrow" type="button" data-target="upcomingRail" data-dir="-1" aria-label="Scroll upcoming trips left">‹</button>
            <button className="arrow" type="button" data-target="upcomingRail" data-dir="1" aria-label="Scroll upcoming trips right">›</button>
          </div>
        </div>
        <div className="rail" id="upcomingRail" tabIndex={0} aria-label="Upcoming trips" />
      </div>
    </section>
  );
}
