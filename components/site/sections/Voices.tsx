import { serverT } from "@/lib/lang-server";
import { Icon } from "../Icon";

/**
 * Testimonials. Edited in Admin → Marketing → CMS → Testimonials; only rows with "Is published" ticked are shown.
 * Hidden until publicContent.ts loads them from /api/v1/testimonials/ (and stays hidden when there are none).
 */
export async function Voices() {
  const t = await serverT();
  return (
    <section className="voices on-light pad" id="voices" aria-labelledby="voices-title" hidden>
      <div className="wrap">
        <div className="voices-head" data-reveal="">
          <div>
            <div className="eyebrow">{t("07 · Kind words")}</div>
            <h2 className="h-section" id="voices-title">
              {t("h.voices.1")}
              <br />
              <em>{t("h.voices.2")}</em>
            </h2>
          </div>
          <div className="voice-ctrl">
            <button type="button" className="vbtn" id="voice-prev" aria-label="Previous testimonial">
              <svg aria-hidden="true" style={{ transform: "scaleX(-1)" }}>
                <use href="#i-arrow" />
              </svg>
            </button>
            {" "}
            <button type="button" className="vbtn" id="voice-next" aria-label="Next testimonial">
              <Icon name="arrow" />
            </button>
          </div>
        </div>
        <div className="voice-track" id="voice-track" tabIndex={0} aria-label="Testimonials" />
      </div>
    </section>
  );
}
