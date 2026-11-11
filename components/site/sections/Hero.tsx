import { Icon } from "../Icon";

export function Hero() {
  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      <div className="hero-photo" id="hero-photo">
        <div className="ph" style={{ position: "absolute", inset: "0" }} data-label="Charminar at night, Hyderabad">
          <img src="assets/img/hero-night-1200.jpg" srcSet="assets/img/hero-night-640.jpg 640w, assets/img/hero-night-1200.jpg 1200w, assets/img/hero-night-1920.jpg 1920w" sizes="100vw" width="3840" height="2558" alt="Charminar's arches and minarets lit warm against the dark night sky, photographed from below with bamboo scaffolding on the minarets" loading="eager" fetchPriority="high" decoding="async" />
        </div>
      </div>
      <div className="wrap">
        <div className="hero-copy">
          <p className="hero-place">
            <Icon name="pin" />
            Hyderabad, India
          </p>
          <h1 id="hero-title">
            <span>Your weekends,</span>
            <span>
              <em>re</em>
              imagined.
            </span>
          </h1>
          <p>
            Discover a different side of Hyderabad. Ride out, play hard, explore hidden gems, and meet your kind of people.
          </p>
          <div className="hero-actions">
            <a className="btn" href="#experiences">
              Explore experiences
              <Icon name="arrow" />
            </a>
            {" "}
            <a className="btn btn-ghost" href="#events">Upcoming events</a>
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
        <span>Meet · Explore · Experience</span>
        <a className="scroll-cue" href="#events">
          Scroll
          <Icon name="down" />
        </a>
      </div>
    </section>
  );
}
