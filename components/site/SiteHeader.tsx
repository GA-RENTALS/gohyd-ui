import { serverT } from "@/lib/lang-server";
import { HeaderAccount } from "@/components/booking/AccountMenu";
import { Icon } from "./Icon";
import { LanguageSwitcher } from "./LanguageSwitcher";

export async function SiteHeader() {
  const t = await serverT();
  return (
    <>
      <header className="header" id="header">
        <div className="progress" id="progress" aria-hidden="true" />
        <div className="wrap nav">
          <a className="brand" href="#home" aria-label="GoHyderabad home">
            <img src="assets/logo-96.webp" width="96" height="96" alt="" />
            {" "}
            <span>
              <b>GoHyderabad</b>
              <small>{t("Meet · Explore · Experience")}</small>
            </span>
          </a>
          <nav className="nav-links" id="nav-links" aria-label="Main navigation">
            <a href="#experiences">{t("Experiences")}</a>
            {" "}
            <a href="#events">{t("Events")}</a>
            {" "}
            <a href="#explore">{t("Explore Hyderabad")}</a>
            {" "}
            <a href="#community">{t("Community")}</a>
            {" "}
            <a href="#how">{t("How it works")}</a>
            {" "}
            <a className="nav-book" href="/trips">{t("Book a trip")}</a>
          </nav>
          <a className="btn" href="/trips">
            {t("Book a trip")}
            <Icon name="up-right" />
          </a>
          {" "}
          <LanguageSwitcher />
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
