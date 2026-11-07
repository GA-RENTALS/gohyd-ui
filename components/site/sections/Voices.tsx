import { Icon } from "../Icon";

export function Voices() {
  return (
    <section className="voices on-light pad" id="voices" aria-labelledby="voices-title">
      <div className="wrap">
        <div className="voices-head" data-reveal="">
          <div>
            <div className="eyebrow">07 · Kind words</div>
            <h2 className="h-section" id="voices-title">
              Heard on
              <br />
              <em>the road.</em>
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
        <div className="voice-track" id="voice-track" tabIndex={0} aria-label="Testimonials">
          <figure className="voice" data-reveal="" data-d="0">
            <div className="stars" role="img" aria-label="5 out of 5 stars">★★★★★</div>
            <blockquote>
              “Came alone for a sunrise ride and left with a group chat full of new friends. Easily the best way I've spent a Sunday.”
            </blockquote>
            <figcaption>
              <span className="avatar" aria-hidden="true">A</span>
              <span>
                <b>Ananya R.</b>
                <small>Sunrise ride · Ananthagiri</small>
              </span>
            </figcaption>
          </figure>
          <figure className="voice" data-reveal="" data-d="1">
            <div className="stars" role="img" aria-label="5 out of 5 stars">★★★★★</div>
            <blockquote>
              “The box cricket nights are chaos in the best way. Organised, friendly, and nobody takes the score too seriously.”
            </blockquote>
            <figcaption>
              <span className="avatar" aria-hidden="true">K</span>
              <span>
                <b>Karthik M.</b>
                <small>Box cricket regular</small>
              </span>
            </figcaption>
          </figure>
          <figure className="voice" data-reveal="" data-d="2">
            <div className="stars" role="img" aria-label="5 out of 5 stars">★★★★★</div>
            <blockquote>
              “I've lived here eight years and never saw the Old City like this. The food walk alone was worth it.”
            </blockquote>
            <figcaption>
              <span className="avatar" aria-hidden="true">F</span>
              <span>
                <b>Fatima S.</b>
                <small>Charminar food walk</small>
              </span>
            </figcaption>
          </figure>
          <figure className="voice" data-reveal="" data-d="3">
            <div className="stars" role="img" aria-label="5 out of 5 stars">★★★★★</div>
            <blockquote>
              “Our team outing felt effortless. Everything was planned, and people actually talked to each other afterwards.”
            </blockquote>
            <figcaption>
              <span className="avatar" aria-hidden="true">R</span>
              <span>
                <b>Rohit V.</b>
                <small>Team outing</small>
              </span>
            </figcaption>
          </figure>
          <figure className="voice" data-reveal="" data-d="4">
            <div className="stars" role="img" aria-label="5 out of 5 stars">★★★★★</div>
            <blockquote>
              “Felt safe, welcoming and genuinely fun. I signed up for the next two plans before we even got back.”
            </blockquote>
            <figcaption>
              <span className="avatar" aria-hidden="true">S</span>
              <span>
                <b>Sneha P.</b>
                <small>First-timer</small>
              </span>
            </figcaption>
          </figure>
          <figure className="voice" data-reveal="" data-d="5">
            <div className="stars" role="img" aria-label="5 out of 5 stars">★★★★★</div>
            <blockquote>
              “From golden hour at Golconda to chai at midnight, every plan has a story. This is how weekends should feel.”
            </blockquote>
            <figcaption>
              <span className="avatar" aria-hidden="true">I</span>
              <span>
                <b>Imran K.</b>
                <small>Weekend explorer</small>
              </span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
