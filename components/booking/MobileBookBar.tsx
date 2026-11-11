"use client";
import { useEffect, useState } from "react";

/** Phones only: a bar pinned to the bottom of the trip page so "Book" is always one tap away. It hides while the booking panel itself is on screen. */
export function MobileBookBar({ price, label = "From", suffix, cta = "Book now" }: { price: string; label?: string; suffix?: string; cta?: string }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const panel = document.getElementById("book");
    if (!panel || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => setHidden(entry.isIntersecting), { threshold: 0.15 });
    io.observe(panel);
    return () => io.disconnect();
  }, []);
  return (
    <a className={`bk-bookbar${hidden ? " is-hidden" : ""}`} href="#book" aria-hidden={hidden || undefined} tabIndex={hidden ? -1 : undefined}>
      <span>{label} <strong>{price}</strong>{suffix && <small className="bk-bookbar-suffix"> {suffix}</small>}</span>
      <span className="bk-bookbar-cta">{cta}</span>
    </a>
  );
}
