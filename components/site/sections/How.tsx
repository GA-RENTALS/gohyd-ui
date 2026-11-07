import { Icon } from "../Icon";

export function How() {
  return (
    <section className="how pad" id="how" aria-labelledby="how-title">
      <div className="wrap">
        <div className="how-head" data-reveal="">
          <div>
            <div className="eyebrow">06 · No complicated plans</div>
            <h2 className="h-section" id="how-title">
              Three steps.
              <br />
              <em>One good weekend.</em>
            </h2>
          </div>
          <span className="section-no">HOW IT WORKS</span>
        </div>
        <div className="steps">
          <article className="step" data-reveal="">
            <div className="step-n">01</div>
            <h3>Find your plan.</h3>
            <p>Explore the kinds of rides, games and get-togethers you'd be excited to join.</p>
          </article>
          <article className="step" data-reveal="" data-d="1">
            <div className="step-n">02</div>
            <h3>Check the details.</h3>
            <p>
              Open the latest announcement for the real date, meeting point, price and booking information.
            </p>
          </article>
          <article className="step" data-reveal="" data-d="2">
            <div className="step-n">03</div>
            <h3>Show up & connect.</h3>
            <p>Meet the group, enjoy the experience and give your next weekend a better story.</p>
          </article>
        </div>
        <aside className="teams" data-reveal="">
          <div>
            <div className="eyebrow">For teams</div>
            <h3>Bring your team out.</h3>
            <p>Looking for a corporate offsite or group outing? Ask GoHyderabad about current options.</p>
          </div>
          <a className="btn btn-ghost" href="https://www.instagram.com/gohyderabad/" target="_blank" rel="noopener noreferrer">
            Message on Instagram
            <Icon name="up-right" />
          </a>
        </aside>
      </div>
    </section>
  );
}
