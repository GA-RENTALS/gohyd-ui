import { HeaderAccount } from "@/components/booking/AccountMenu";
import { Icon } from "./Icon";

export function SiteHeader() {
  return (
    <>
      <header className="header" id="header">
        <div className="progress" id="progress" aria-hidden="true" />
        <div className="wrap nav">
          <a className="brand" href="#home" aria-label="GoHyderabad home">
            <img src="assets/logo.png" width="160" height="160" alt="" />
            {" "}
            <span>
              <b>GoHyderabad</b>
              <small>Meet · Explore · Experience</small>
            </span>
          </a>
          <nav className="nav-links" id="nav-links" aria-label="Main navigation">
            <a href="#experiences">Experiences</a>
            {" "}
            <a href="#events">Events</a>
            {" "}
            <a href="#explore">Explore Hyderabad</a>
            {" "}
            <a href="#community">Community</a>
            {" "}
            <a href="#how">How it works</a>
            {" "}
            <a className="nav-book" href="/trips">Book a trip</a>
          </nav>
          <a className="btn" href="/trips">
            Book a trip
            <Icon name="up-right" />
          </a>
          {" "}
          <HeaderAccount />
          <button className="menu-btn" id="menu-btn" type="button" aria-label="Open navigation" aria-controls="nav-links" aria-expanded="false">
            <svg aria-hidden="true" id="menu-icon">
              <use href="#i-menu" />
            </svg>
          </button>
        </div>
      </header>
      <a className="btn sticky-cta" id="sticky-cta" href="https://www.instagram.com/gohyderabad/" target="_blank" rel="noopener noreferrer">
        See latest plans
        <Icon name="up-right" />
      </a>
    </>
  );
}
