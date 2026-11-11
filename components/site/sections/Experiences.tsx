import { serverT } from "@/lib/lang-server";
import { Icon } from "../Icon";

export async function Experiences() {
  const t = await serverT();
  return (
    <section className="experiences pad" id="experiences" aria-labelledby="exp-title">
      <div className="wrap">
        <div className="exp-head" data-reveal="">
          <div>
            <div className="eyebrow">{t("02 · Choose your pace")}</div>
            <h2 className="h-section" id="exp-title">
              {t("h.exp.1")}
              <br />
              <em>{t("h.exp.2")}</em>
            </h2>
          </div>
          <p className="lede">
            {t("Go for the rush, the fresh air, the food, or simply the company. Find a plan that feels like you.")}
          </p>
        </div>
        <div className="exp-grid">
          <a className="xcard x1" href="#events" data-filter="rides" data-reveal="" aria-label="Adventure and road trips — see ride plans">
            <div className="ph" data-label="Motorcyclists on a mountain highway">
              <img src="assets/img/ride-himalaya-1200.jpg" srcSet="assets/img/ride-himalaya-640.jpg 640w, assets/img/ride-himalaya-1200.jpg 1200w, assets/img/ride-himalaya-1920.jpg 1920w" sizes="(min-width:900px) 58vw, 100vw" width="3840" height="2414" alt="Motorcyclists riding a winding mountain highway beneath a deep blue sky and barren Himalayan peaks" loading="lazy" decoding="async" />
              <span className="ptag">{t("Photo · Ladakh")}</span>
            </div>
            <span className="n">01</span>
            <h3>{t("Adventure & Road Trips")}</h3>
            <p>
              {t("Leave the ring road behind. Early starts, open highways and the kind of views a weekend deserves.")}
            </p>
            <span className="go">
              {t("Discover rides")}
              <Icon name="arrow" />
            </span>
          </a>
          {" "}
          <a className="xcard x2" href="#events" data-filter="sports" data-reveal="" data-d="1" aria-label="Sports and box cricket — see sports plans">
            <div className="ph" data-label="Friends playing cricket on a grass ground">
              <img src="assets/img/cricket-morning-1200.jpg" srcSet="assets/img/cricket-morning-640.jpg 640w, assets/img/cricket-morning-1200.jpg 1200w, assets/img/cricket-morning-1920.jpg 1920w" sizes="(min-width:900px) 40vw, 100vw" width="3840" height="2737" alt="Young players mid-game on a grass cricket ground, a batter at the stumps and a fielder crouching in the foreground" loading="lazy" decoding="async" />
              <span className="ptag">{t("Photo · India")}</span>
            </div>
            <span className="n">02</span>
            <h3>{t("Sports & Box Cricket")}</h3>
            <p>{t("Pick a side, grab a bat. Friendly matches where the only pressure is the last over.")}</p>
            <span className="go">
              {t("Discover games")}
              <Icon name="arrow" />
            </span>
          </a>
          {" "}
          <a className="xcard x3" href="#events" data-filter="food" data-reveal="" aria-label="Food and cafés — see food plans">
            <div className="ph" data-label="Hyderabadi dum biryani">
              <img src="assets/img/biryani-1200.jpg" srcSet="assets/img/biryani-640.jpg 640w, assets/img/biryani-1200.jpg 1200w, assets/img/biryani-1920.jpg 1920w" sizes="(min-width:900px) 30vw, 100vw" width="3840" height="2550" alt="A copper handi of Hyderabadi chicken dum biryani with fried onions, served with raita" loading="lazy" decoding="async" />
            </div>
            <span className="n">03</span>
            <h3>{t("Food & Cafés")}</h3>
            <p>{t("From bun maska and chai to a copper handi of dum biryani, the city runs on its tables.")}</p>
            <span className="go">
              {t("Discover tables")}
              <Icon name="arrow" />
            </span>
          </a>
          {" "}
          <a className="xcard x4" href="#events" data-filter="culture" data-reveal="" data-d="1" aria-label="Art and culture — see culture plans">
            <div className="ph" data-label="Chowmahalla Palace, Hyderabad">
              <img src="assets/img/chowmahalla-1200.jpg" srcSet="assets/img/chowmahalla-640.jpg 640w, assets/img/chowmahalla-1200.jpg 1200w, assets/img/chowmahalla-1920.jpg 1920w" sizes="(min-width:900px) 30vw, 100vw" width="3840" height="2880" alt="The Chowmahalla Palace in Hyderabad, its arched facade and clock tower seen across a green lawn" loading="lazy" decoding="async" />
            </div>
            <span className="n">04</span>
            <h3>{t("Art & Culture")}</h3>
            <p>{t("Palaces, crafts and living traditions, explored with people who like to look closer.")}</p>
            <span className="go">
              {t("Discover culture")}
              <Icon name="arrow" />
            </span>
          </a>
          {" "}
          <a className="xcard x5" href="#events" data-filter="social" data-reveal="" data-d="2" aria-label="Social meetups — see meetup plans">
            <div className="ph" data-label="Crowds at Mecca Masjid at night">
              <img src="assets/img/mecca-masjid-1200.jpg" srcSet="assets/img/mecca-masjid-640.jpg 640w, assets/img/mecca-masjid-1200.jpg 1200w, assets/img/mecca-masjid-1920.jpg 1920w" sizes="(min-width:900px) 30vw, 100vw" width="3840" height="2880" alt="A crowd gathered in the evening below the Mecca Masjid in Hyderabad, its arches lit in purple, green and gold" loading="lazy" decoding="async" />
            </div>
            <span className="n">05</span>
            <h3>{t("Social Meetups")}</h3>
            <p>{t("Start with a plan, end with a crew. Easy company, good conversation, no pressure.")}</p>
            <span className="go">
              {t("Discover meetups")}
              <Icon name="arrow" />
            </span>
          </a>
          {" "}
          <a className="xcard x6" href="#events" data-filter="gems" data-reveal="" aria-label="Hidden gems — see hidden gem plans">
            <div className="ph" data-label="Qutb Shahi Tombs lit at night">
              <img src="assets/img/qutb-shahi-1200.jpg" srcSet="assets/img/qutb-shahi-640.jpg 640w, assets/img/qutb-shahi-1200.jpg 1200w, assets/img/qutb-shahi-1920.jpg 1920w" sizes="100vw" width="3840" height="2560" alt="The domes of the Qutb Shahi Tombs in Hyderabad, softly lit against the night sky" loading="lazy" decoding="async" />
            </div>
            <span className="n">06</span>
            <h3>{t("Hidden Gems")}</h3>
            <p>{t("Tombs lit up after dark, forested hills, quiet lakes. The corners most weekends miss.")}</p>
            <span className="go">
              {t("Discover gems")}
              <Icon name="arrow" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
