import { serverT } from "@/lib/lang-server";
import { Icon } from "../Icon";

export async function Community() {
  const t = await serverT();
  return (
    <section className="community on-light pad" id="community" aria-labelledby="community-title">
      <div className="wrap">
        <div className="journal-head" data-reveal="">
          <div>
            <div className="eyebrow">{t("05 · The best part is who you meet")}</div>
            <h2 className="h-section" id="community-title">
              {t("h.com.1")}
              <br />
              <em>{t("h.com.2")}</em>
            </h2>
          </div>
          <p className="lede">
            {t("The goal isn't just to fill a Saturday. It's to find people who will say yes to the next one. Start with an activity; let the rest happen naturally.")}
          </p>
        </div>
        <div className="journal">
          <figure className="jtile j1" data-reveal="">
            <div className="ph" style={{ position: "absolute", inset: "0" }} data-label="Ananthagiri trail">
              <img src="assets/img/w/ananthagiri-trail-1200.webp" srcSet="assets/img/w/ananthagiri-trail-480.webp 480w, assets/img/w/ananthagiri-trail-800.webp 800w, assets/img/w/ananthagiri-trail-1200.webp 1200w, assets/img/w/ananthagiri-trail-1600.webp 1600w" sizes="(min-width:900px) 40vw, 100vw" width="3264" height="2448" alt="A shaded dirt trail among twisting trees in the forest of Ananthagiri Hills" loading="lazy" decoding="async" />
            </div>
            <figcaption>
              <b>{t("Out on the trail")}</b>
              {t("Ananthagiri Hills")}
            </figcaption>
          </figure>
          <figure className="jtile j2" data-reveal="" data-d="1">
            <div className="ph" style={{ position: "absolute", inset: "0" }} data-label="Night street food stall in Hyderabad">
              <img src="assets/img/w/street-food-1200.webp" srcSet="assets/img/w/street-food-480.webp 480w, assets/img/w/street-food-800.webp 800w, assets/img/w/street-food-1200.webp 1200w, assets/img/w/street-food-1600.webp 1600w" sizes="(min-width:900px) 28vw, 50vw" width="2816" height="2112" alt="A glass-fronted street food cart under warm streetlights at night in Hyderabad, with cycles parked beside it" loading="lazy" decoding="async" />
            </div>
            <figcaption>
              <b>{t("Late-night bites")}</b>
              {t("A street food cart, Hyderabad")}
            </figcaption>
          </figure>
          <figure className="jtile j3" data-reveal="" data-d="2">
            <div className="ph" style={{ position: "absolute", inset: "0" }} data-label="Lac bangles at Laad Bazaar">
              <img src="assets/img/w/laad-bangles-1200.webp" srcSet="assets/img/w/laad-bangles-480.webp 480w, assets/img/w/laad-bangles-800.webp 800w, assets/img/w/laad-bangles-1200.webp 1200w" sizes="(min-width:900px) 30vw, 50vw" width="1420" height="1120" alt="A hand sorting through heaps of colourful sparkling lac bangles at Laad Bazaar" loading="lazy" decoding="async" />
            </div>
            <figcaption>
              <b>{t("Colour and craft")}</b>
              {t("Laad Bazaar")}
            </figcaption>
          </figure>
          <figure className="jtile j4" data-reveal="">
            <div className="ph" style={{ position: "absolute", inset: "0" }} data-label="Durgam Cheruvu from above">
              <img src="assets/img/w/durgam-aerial-1200.webp" srcSet="assets/img/w/durgam-aerial-480.webp 480w, assets/img/w/durgam-aerial-800.webp 800w, assets/img/w/durgam-aerial-1200.webp 1200w, assets/img/w/durgam-aerial-1600.webp 1600w" sizes="(min-width:900px) 30vw, 50vw" width="3840" height="2560" alt="Aerial view of the Durgam Cheruvu lake and cable bridge with the HITEC City skyline beyond" loading="lazy" decoding="async" />
            </div>
            <figcaption>
              <b>{t("The view from above")}</b>
              {t("Durgam Cheruvu")}
            </figcaption>
          </figure>
          <figure className="jtile j5" data-reveal="" data-d="1">
            <div className="ph" style={{ position: "absolute", inset: "0" }} data-label="Hussain Sagar at night">
              <img src="assets/img/w/hussain-sagar-1200.webp" srcSet="assets/img/w/hussain-sagar-480.webp 480w, assets/img/w/hussain-sagar-800.webp 800w, assets/img/w/hussain-sagar-1200.webp 1200w, assets/img/w/hussain-sagar-1600.webp 1600w" sizes="(min-width:900px) 30vw, 50vw" width="3840" height="2570" alt="The Buddha statue on Hussain Sagar lake at night, with city lights reflected in the water" loading="lazy" decoding="async" />
            </div>
            <figcaption>
              <b>{t("Evenings by the water")}</b>
              {t("Hussain Sagar")}
            </figcaption>
          </figure>
          <figure className="jtile j6" data-reveal="" data-d="2">
            <div className="ph" style={{ position: "absolute", inset: "0" }} data-label="Golconda Fort and the city">
              <img src="assets/img/w/golconda-city-1200.webp" srcSet="assets/img/w/golconda-city-480.webp 480w, assets/img/w/golconda-city-800.webp 800w, assets/img/w/golconda-city-1200.webp 1200w, assets/img/w/golconda-city-1600.webp 1600w" sizes="(min-width:900px) 30vw, 50vw" width="3840" height="2560" alt="A ruined stone structure at Golconda Fort with the Hyderabad skyline stretching out behind it" loading="lazy" decoding="async" />
            </div>
            <figcaption>
              <b>{t("The old and the new")}</b>
              {t("Golconda Fort, with the city behind")}
            </figcaption>
          </figure>
        </div>
        <div className="quote-band" data-reveal="">
          <p>{t("Strangers today. Teammates tomorrow.")}</p>
          <div className="links">
            <a className="link" href="https://www.instagram.com/gohyderabad/" target="_blank" rel="noopener noreferrer">
              @gohyderabad
              <Icon name="up-right" />
            </a>
            {" "}
            <a className="link" href="https://www.instagram.com/goadventure.in/" target="_blank" rel="noopener noreferrer">
              @goadventure.in
              <Icon name="up-right" />
            </a>
          </div>
        </div>
        <p className="note-small" data-reveal="">
          {t("The photographs here are openly licensed images of the places GoHyderabad explores, credited at the foot of the page. GoHyderabad's own community moments live on Instagram.")}
        </p>
      </div>
    </section>
  );
}
