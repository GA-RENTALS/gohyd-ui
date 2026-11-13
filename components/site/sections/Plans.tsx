import { serverT } from "@/lib/lang-server";

/**
 * "Plan your next trip": published Events that have no date yet (the upcoming plans), with category filter chips.
 * Hidden until publicContent.ts loads the events, then it fills the chips and the rail. Dated events stay in Events.
 */
export async function Plans() {
  const t = await serverT();
  return (
    <section className="plans on-light pad" id="plans" aria-labelledby="plans-title" hidden>
      <div className="wrap">
        <div className="eyebrow" data-reveal="">{t("Plan your next trip")}</div>
        <div className="section-top" data-reveal="">
          <div>
            <h2 className="rail-title" id="plans-title">
              {t("Upcoming")}
              {" "}
              <span>{t("plans")}</span>
            </h2>
            <p className="hint" id="plans-count">{t("Treks, forts, lakes, waterfalls and more — dates announced soon")}</p>
          </div>
          <div className="controls">
            <button className="arrow" type="button" data-target="plans-grid" data-dir="-1" aria-label="Scroll plans left">‹</button>
            <button className="arrow" type="button" data-target="plans-grid" data-dir="1" aria-label="Scroll plans right">›</button>
          </div>
        </div>
        <div className="chips plan-chips" id="plans-chips" role="group" aria-label="Filter plans by category" />
        <div className="rail" id="plans-grid" tabIndex={0} aria-label="Upcoming plans" />
      </div>
    </section>
  );
}
