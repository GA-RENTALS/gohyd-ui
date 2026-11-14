import { serverT } from "@/lib/lang-server";
import { CreditItem } from "./CreditItem";
import { NewsletterSignup } from "./NewsletterSignup";
import { CREDITS } from "./data/credits";
import Link from "next/link";

export async function SiteFooter() {
  const t = await serverT();
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <a className="brand" href="#home" aria-label="GoHyderabad home">
              <img src="assets/logo-96.webp" width="96" height="96" alt="" />
              <span>
                <b>GoHyderabad</b>
                <small>{t("Meet · Explore · Experience")}</small>
              </span>
            </a>
            <p>{t("Weekend experiences around Hyderabad, built around the joy of finding your people.")}</p>
          </div>
          <nav aria-label="Footer navigation">
            <h2>{t("Explore")}</h2>
            <div className="foot-links">
              <Link href="/trips">{t("Book a trip")}</Link>
              <Link href="/experiences">{t("Experiences")}</Link>
              <Link href="/explore">{t("Explore Hyderabad")}</Link>
              <Link href="/destinations">{t("Destinations")}</Link>
              <Link href="/blogs">{t("Stories & guides")}</Link>
              <Link href="/community">{t("Community")}</Link>
              <Link href="/membership">{t("Membership")}</Link>
              <Link href="/how-it-works">{t("How it works")}</Link>
              <Link href="/faqs">{t("FAQs")}</Link>
              <Link href="/about">{t("About")}</Link>
              <Link href="/contact">{t("Contact")}</Link>
              <Link href="/corporate">{t("Corporate outings")}</Link>
            </div>
          </nav>
          <div>
            <h2>{t("Stay in the loop")}</h2>
            <NewsletterSignup />
            <div className="foot-links">
              <a href="https://www.instagram.com/gohyderabad/" target="_blank" rel="noopener noreferrer">Instagram · @gohyderabad ↗</a>
              <a href="https://www.instagram.com/goadventure.in/" target="_blank" rel="noopener noreferrer">Instagram · @goadventure.in ↗</a>
            </div>
          </div>
        </div>
        <details className="credits" id="credits">
          <summary>{t("Photo credits & licences")}</summary>
          <ol>
            <li className="intro-note">
              {t("All photographs are from Wikimedia Commons and used under the licences shown. Where a photo was taken outside Hyderabad, it is labelled on the image.")}
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
