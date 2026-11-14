import { serverLang, serverT } from "@/lib/lang-server";
import { Icon } from "../Icon";

export async function Hero() {
  const t = await serverT();
  const lang = await serverLang();
  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      <div className="hero-photo" id="hero-photo">
        <div className="ph" style={{ position: "absolute", inset: "0" }} data-label="Charminar at night, Hyderabad">
          <img src="assets/img/w/hero-night-1200.webp" srcSet="assets/img/w/hero-night-480.webp 480w, assets/img/w/hero-night-800.webp 800w, assets/img/w/hero-night-1200.webp 1200w, assets/img/w/hero-night-1600.webp 1600w" sizes="100vw" width="3840" height="2558" alt="Charminar's arches and minarets lit warm against the dark night sky, photographed from below with bamboo scaffolding on the minarets" loading="eager" fetchPriority="high" decoding="async" />
        </div>
      </div>
      <div className="wrap">
        <div className="hero-copy">
          <p className="hero-place">
            <Icon name="pin" />
            {t("Hyderabad, India")}
          </p>
          <h1 id="hero-title">
            <span>{t("h.hero.1")}</span>
            {lang === "en" ? (
              <span>
                <em>re</em>
                imagined.
              </span>
            ) : <span><em>{t("h.hero.2")}</em></span>}
          </h1>
          <p>
            {t("Discover a different side of Hyderabad. Ride out, play hard, explore hidden gems, and meet your kind of people.")}
          </p>
          <div className="hero-actions">
            <a className="btn" href="#experiences">
              {t("Explore experiences")}
              <Icon name="arrow" />
            </a>
            {" "}
            <a className="btn btn-ghost" href="#events">{t("Upcoming events")}</a>
          </div>
        </div>
      </div>
      <aside className="hero-caption" aria-label="About the photograph">
        <b>Charminar</b>
        <p>
          Old City, Hyderabad, at night. Raised in 1591 by Muhammad Quli Qutb Shah. Photo:
          {" "}
          <a href="https://commons.wikimedia.org/wiki/File%3APerspective_view_of_Charminar_at_night_%28June_2019%29.jpg" target="_blank" rel="noopener noreferrer">iMahesh</a>
          {" "}
          · CC BY-SA 4.0.
        </p>
      </aside>
      <div className="hero-foot">
        <span>{t("Meet · Explore · Experience")}</span>
        <a className="scroll-cue" href="#events">
          {t("Scroll")}
          <Icon name="down" />
        </a>
      </div>
    </section>
  );
}
