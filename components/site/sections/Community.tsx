import { Icon } from "../Icon";

export function Community() {
  return (
    <section className="community on-light pad" id="community" aria-labelledby="community-title">
      <div className="wrap">
        <div className="journal-head" data-reveal="">
          <div>
            <div className="eyebrow">05 · The best part is who you meet</div>
            <h2 className="h-section" id="community-title">
              A good plan.
              <br />
              <em>Better people.</em>
            </h2>
          </div>
          <p className="lede">
            The goal isn't just to fill a Saturday. It's to find people who will say yes to the next one. Start with an activity; let the rest happen naturally.
          </p>
        </div>
        <div className="journal">
          <figure className="jtile j1" data-reveal="">
            <div className="ph" style={{ position: "absolute", inset: "0" }} data-label="Ananthagiri trail">
              <img src="assets/img/ananthagiri-trail-1200.jpg" srcSet="assets/img/ananthagiri-trail-640.jpg 640w, assets/img/ananthagiri-trail-1200.jpg 1200w, assets/img/ananthagiri-trail-1920.jpg 1920w" sizes="(min-width:900px) 40vw, 100vw" width="3264" height="2448" alt="A shaded dirt trail among twisting trees in the forest of Ananthagiri Hills" loading="lazy" decoding="async" />
            </div>
            <figcaption>
              <b>Out on the trail</b>
              Ananthagiri Hills
            </figcaption>
          </figure>
          <figure className="jtile j2" data-reveal="" data-d="1">
            <div className="ph" style={{ position: "absolute", inset: "0" }} data-label="Night street food stall in Hyderabad">
              <img src="assets/img/street-food-1200.jpg" srcSet="assets/img/street-food-640.jpg 640w, assets/img/street-food-1200.jpg 1200w, assets/img/street-food-1920.jpg 1920w" sizes="(min-width:900px) 28vw, 50vw" width="2816" height="2112" alt="A glass-fronted street food cart under warm streetlights at night in Hyderabad, with cycles parked beside it" loading="lazy" decoding="async" />
            </div>
            <figcaption>
              <b>Late-night bites</b>
              A street food cart, Hyderabad
            </figcaption>
          </figure>
          <figure className="jtile j3" data-reveal="" data-d="2">
            <div className="ph" style={{ position: "absolute", inset: "0" }} data-label="Lac bangles at Laad Bazaar">
              <img src="assets/img/laad-bangles-1200.jpg" srcSet="assets/img/laad-bangles-640.jpg 640w, assets/img/laad-bangles-1200.jpg 1200w" sizes="(min-width:900px) 30vw, 50vw" width="1420" height="1120" alt="A hand sorting through heaps of colourful sparkling lac bangles at Laad Bazaar" loading="lazy" decoding="async" />
            </div>
            <figcaption>
              <b>Colour and craft</b>
              Laad Bazaar
            </figcaption>
          </figure>
          <figure className="jtile j4" data-reveal="">
            <div className="ph" style={{ position: "absolute", inset: "0" }} data-label="Durgam Cheruvu from above">
              <img src="assets/img/durgam-aerial-1200.jpg" srcSet="assets/img/durgam-aerial-640.jpg 640w, assets/img/durgam-aerial-1200.jpg 1200w, assets/img/durgam-aerial-1920.jpg 1920w" sizes="(min-width:900px) 30vw, 50vw" width="3840" height="2560" alt="Aerial view of the Durgam Cheruvu lake and cable bridge with the HITEC City skyline beyond" loading="lazy" decoding="async" />
            </div>
            <figcaption>
              <b>The view from above</b>
              Durgam Cheruvu
            </figcaption>
          </figure>
          <figure className="jtile j5" data-reveal="" data-d="1">
            <div className="ph" style={{ position: "absolute", inset: "0" }} data-label="Hussain Sagar at night">
              <img src="assets/img/hussain-sagar-1200.jpg" srcSet="assets/img/hussain-sagar-640.jpg 640w, assets/img/hussain-sagar-1200.jpg 1200w, assets/img/hussain-sagar-1920.jpg 1920w" sizes="(min-width:900px) 30vw, 50vw" width="3840" height="2570" alt="The Buddha statue on Hussain Sagar lake at night, with city lights reflected in the water" loading="lazy" decoding="async" />
            </div>
            <figcaption>
              <b>Evenings by the water</b>
              Hussain Sagar
            </figcaption>
          </figure>
          <figure className="jtile j6" data-reveal="" data-d="2">
            <div className="ph" style={{ position: "absolute", inset: "0" }} data-label="Golconda Fort and the city">
              <img src="assets/img/golconda-city-1200.jpg" srcSet="assets/img/golconda-city-640.jpg 640w, assets/img/golconda-city-1200.jpg 1200w, assets/img/golconda-city-1920.jpg 1920w" sizes="(min-width:900px) 30vw, 50vw" width="3840" height="2560" alt="A ruined stone structure at Golconda Fort with the Hyderabad skyline stretching out behind it" loading="lazy" decoding="async" />
            </div>
            <figcaption>
              <b>The old and the new</b>
              Golconda Fort, with the city behind
            </figcaption>
          </figure>
        </div>
        <div className="quote-band" data-reveal="">
          <p>Strangers today. Teammates tomorrow.</p>
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
          The photographs here are openly licensed images of the places GoHyderabad explores, credited at the foot of the page. GoHyderabad's own community moments live on Instagram.
        </p>
      </div>
    </section>
  );
}
