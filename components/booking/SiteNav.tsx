"use client";
import Link from "next/link";
import { AccountMenu } from "./AccountMenu";

/** Header for the booking pages. The home page has its own animated header; this one is plain and always readable. */
export function SiteNav() {
  return (
    <header className="header scrolled">
      <div className="wrap nav">
        <Link className="brand" href="/" aria-label="GoHyderabad home">
          <img src="/brand/gohyderabad-mark.png" width="44" height="44" alt="" />
          <span><b>GoHyderabad</b><small>Meet · Explore · Experience</small></span>
        </Link>
        <nav className="bk-nav" aria-label="Main navigation">
          <Link href="/trips">Trips</Link>
          <Link href="/#explore">Explore Hyderabad</Link>
        </nav>
        <AccountMenu />
      </div>
    </header>
  );
}
