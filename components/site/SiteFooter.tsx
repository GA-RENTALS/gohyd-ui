import { CreditItem } from "./CreditItem";
import { CREDITS } from "./data/credits";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <a className="brand" href="#home" aria-label="GoHyderabad home">
              <img src="assets/logo.png" width="160" height="160" alt="" />
              <span>
                <b>GoHyderabad</b>
                <small>Meet · Explore · Experience</small>
              </span>
            </a>
            <p>Weekend experiences around Hyderabad, built around the joy of finding your people.</p>
          </div>
          <nav aria-label="Footer navigation">
            <h2>Explore</h2>
            <div className="foot-links">
              <a href="/trips">Book a trip</a>
              <a href="#experiences">Experiences</a>
              <a href="#events">Events</a>
              <a href="#explore">Explore Hyderabad</a>
              <a href="#community">Community</a>
              <a href="#how">How it works</a>
            </div>
          </nav>
          <div>
            <h2>Stay in the loop</h2>
            <div className="foot-links">
              <a href="https://www.instagram.com/gohyderabad/" target="_blank" rel="noopener noreferrer">Instagram · @gohyderabad ↗</a>
              <a href="https://www.instagram.com/goadventure.in/" target="_blank" rel="noopener noreferrer">Instagram · @goadventure.in ↗</a>
            </div>
          </div>
        </div>
        <details className="credits" id="credits">
          <summary>Photo credits & licences</summary>
          <ol>
            <li className="intro-note">
              All photographs are from Wikimedia Commons and used under the licences shown. Where a photo was taken outside Hyderabad, it is labelled on the image.
            </li>
            {CREDITS.map((credit) => <CreditItem key={credit.fileUrl} credit={credit} />)}
          </ol>
        </details>
        <div className="foot-bottom">
          <span>
            ©
            {" "}
            <span id="year">2026</span>
            {" "}
            <strong>GoHyderabad</strong>
            {" "}
            · Meet. Explore. Experience.
          </span>
          <span>
            Made for weekends in Hyderabad. · Made by Saipavan Siripuram ·
            {" "}
            <a href="https://x.com/saipavan__" target="_blank" rel="noopener noreferrer">X</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
