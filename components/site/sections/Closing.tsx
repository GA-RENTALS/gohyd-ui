import { Icon } from "../Icon";

export function Closing() {
  return (
    <section className="closing" aria-labelledby="closing-title">
      <div className="ph" data-label="Golconda Fort ramparts">
        <img src="assets/img/golconda-fort-1200.jpg" srcSet="assets/img/golconda-fort-640.jpg 640w, assets/img/golconda-fort-1200.jpg 1200w, assets/img/golconda-fort-1920.jpg 1920w" sizes="100vw" width="3840" height="2399" alt="The stone ramparts and ruined halls of Golconda Fort stretching across a green lawn under a blue sky" loading="lazy" decoding="async" />
      </div>
      <div className="wrap" data-reveal="">
        <div className="eyebrow">Your city. Your people. Your weekend.</div>
        <h2 id="closing-title">
          Don't just
          <br />
          spend it.
          {" "}
          <em>Live it.</em>
        </h2>
        <p>
          Your next favourite experience is closer than you think. Find the latest plans and come meet your crew.
        </p>
        <a className="btn" href="https://www.instagram.com/gohyderabad/" target="_blank" rel="noopener noreferrer">
          Find your next adventure
          <Icon name="up-right" />
        </a>
      </div>
      <p className="credit">
        Golconda Fort ·
        {" "}
        <a href="https://commons.wikimedia.org/wiki/File%3AGolconda_Fort_005.jpg" target="_blank" rel="noopener noreferrer">Bernard Gagnon</a>
        {" "}
        · CC BY-SA 3.0
      </p>
    </section>
  );
}
