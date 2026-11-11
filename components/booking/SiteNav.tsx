"use client";
import { useT } from "@/components/site/LangProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { AccountMenu } from "./AccountMenu";

/** Header for the booking pages. The home page has its own animated header; this one is plain and always readable. */
export function SiteNav() {
  const t = useT();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <header className="header scrolled">
      <div className="wrap nav">
        <Link className="brand" href="/" aria-label="GoHyderabad home">
          <img src="/brand/gohyderabad-mark.png" width="44" height="44" alt="" />
          <span><b>GoHyderabad</b><small>{t("Meet · Explore · Experience")}</small></span>
        </Link>
        <nav className="bk-nav" aria-label="Main navigation">
          <Link href="/trips">{t("Trips")}</Link>
          <Link href="/destinations">{t("Places")}</Link>
          <Link href="/experiences">{t("Experiences")}</Link>
          <Link href="/cart">{t("Cart")}</Link>
        </nav>
        <LanguageSwitcher className="bk-lang-desktop" />
        <Link className="bk-cart-icon" href="/cart" aria-label={t("Cart")} title={t("Cart")}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.4L21 8H6" />
            <circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" />
          </svg>
        </Link>
        <AccountMenu />
        <button
          className={`bk-menu-toggle${menuOpen ? " is-open" : ""}`}
          type="button"
          aria-label={menuOpen ? t("Close navigation") : t("Open navigation")}
          aria-expanded={menuOpen}
          aria-controls="booking-mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span /><span /><span />
        </button>
      </div>
      <div className="bk-mobile-nav" id="booking-mobile-nav" hidden={!menuOpen}>
        <nav className="bk-mobile-links" aria-label={t("Main navigation")}>
          <Link href="/trips" onClick={() => setMenuOpen(false)}>{t("Trips")}</Link>
          <Link href="/destinations" onClick={() => setMenuOpen(false)}>{t("Places")}</Link>
          <Link href="/experiences" onClick={() => setMenuOpen(false)}>{t("Experiences")}</Link>
          <Link href="/cart" onClick={() => setMenuOpen(false)}>{t("Cart")}</Link>
        </nav>
        <div className="bk-mobile-language"><span>{t("Language")}</span><LanguageSwitcher /></div>
      </div>
    </header>
  );
}
