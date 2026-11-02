"use client";

import { useEffect } from "react";
import Lenis from "lenis";

const WORDS = ["Ride", "Play", "Eat", "Explore", "Meet"];

export default function Motion() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const cleanups: Array<() => void> = [];
    const root = document.documentElement;

    // Inertial smooth scrolling (mouse/trackpad only; touch keeps native momentum)
    if (!reduce && fine) {
      const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, anchors: true });
      document.getElementById("map")?.setAttribute("data-lenis-prevent-wheel", "");
      let id = requestAnimationFrame(function frame(t) {
        lenis.raf(t);
        id = requestAnimationFrame(frame);
      });
      cleanups.push(() => { cancelAnimationFrame(id); lenis.destroy(); });
    }

    // Splash: lift once the hero image and fonts are ready (or after a cap)
    const heroImg = document.querySelector<HTMLImageElement>("#home .ph img");
    const heroReady = new Promise<void>((res) => {
      if (!heroImg || heroImg.complete) return res();
      heroImg.addEventListener("load", () => res(), { once: true });
      heroImg.addEventListener("error", () => res(), { once: true });
    });
    const fontsReady = document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve();
    const minWait = new Promise<void>((res) => setTimeout(res, 900));
    const cap = new Promise<void>((res) => setTimeout(res, 3500));
    Promise.race([Promise.all([heroReady, fontsReady, minWait]), cap]).then(() => root.classList.add("motion-go"));

    // Fade images in on load, and warm the rest of the page in the background
    const imgs = Array.from(document.querySelectorAll<HTMLImageElement>(".ph img"));
    imgs.forEach((img) => {
      if (img.complete && img.naturalWidth) img.classList.add("is-loaded");
      else {
        img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
        img.addEventListener("error", () => img.classList.add("is-loaded"), { once: true });
      }
    });
    const warm = () => {
      imgs.forEach((img, i) => {
        if (img.loading === "lazy") setTimeout(() => (img.loading = "eager"), i * 120);
      });
    };
    if (document.readyState === "complete") setTimeout(warm, 800);
    else window.addEventListener("load", () => setTimeout(warm, 800), { once: true });

    // Active section in nav
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("#nav-links a[href^='#']"));
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          links.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === `#${en.target.id}`));
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    links.forEach((a) => {
      const t = document.querySelector(a.getAttribute("href") as string);
      if (t) spy.observe(t);
    });
    cleanups.push(() => spy.disconnect());

    // Count-up numbers
    const nums = Array.from(document.querySelectorAll<HTMLElement>(".num[data-count]"));
    const fmt = (n: number, d: number) => n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
    if (!reduce && "IntersectionObserver" in window) {
      const counter = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (!en.isIntersecting) return;
            counter.unobserve(en.target);
            const el = en.target as HTMLElement;
            const end = parseFloat(el.dataset.count || "0");
            const d = parseInt(el.dataset.decimals || "0", 10);
            const suffix = el.dataset.suffix || "";
            const t0 = performance.now();
            const tick = (now: number) => {
              const p = Math.min(1, (now - t0) / 1900);
              el.textContent = fmt(end * (1 - Math.pow(1 - p, 3)), d) + suffix;
              if (p < 1) requestAnimationFrame(tick);
            };
            el.textContent = fmt(0, d) + suffix;
            requestAnimationFrame(tick);
          });
        },
        { threshold: 0.6 }
      );
      nums.forEach((n) => counter.observe(n));
      cleanups.push(() => counter.disconnect());
    }

    // Testimonial carousel
    const track = document.getElementById("voice-track");
    if (track) {
      const step = () => (track.querySelector<HTMLElement>(".voice")?.offsetWidth ?? 400) + 22;
      const go = (dir: number) => {
        const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
        if (dir > 0 && atEnd) track.scrollTo({ left: 0, behavior: reduce ? "auto" : "smooth" });
        else track.scrollBy({ left: dir * step(), behavior: reduce ? "auto" : "smooth" });
      };
      const prev = () => go(-1);
      const next = () => go(1);
      const pb = document.getElementById("voice-prev");
      const nb = document.getElementById("voice-next");
      pb?.addEventListener("click", prev);
      nb?.addEventListener("click", next);
      let paused = false;
      const hold = () => (paused = true);
      const free = () => (paused = false);
      track.addEventListener("pointerenter", hold);
      track.addEventListener("pointerleave", free);
      track.addEventListener("focusin", hold);
      track.addEventListener("focusout", free);
      const auto = reduce ? 0 : window.setInterval(() => { if (!paused && !document.hidden) go(1); }, 5000);
      cleanups.push(() => { clearInterval(auto); pb?.removeEventListener("click", prev); nb?.removeEventListener("click", next); });
    }

    // Card spotlight
    document.querySelectorAll<HTMLElement>(".xcard, .ecard").forEach((card) => {
      const spot = document.createElement("span");
      spot.className = "spot";
      spot.setAttribute("aria-hidden", "true");
      card.appendChild(spot);
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--sx", `${e.clientX - r.left}px`);
        card.style.setProperty("--sy", `${e.clientY - r.top}px`);
      });
    });

    // Marquee band under the hero
    const edge = document.querySelector(".arch-edge");
    if (edge && !document.querySelector(".marquee")) {
      const band = document.createElement("div");
      band.className = "marquee";
      band.setAttribute("aria-hidden", "true");
      const row = WORDS.map((w) => `<b>${w}</b><i>✦</i>`).join("");
      band.innerHTML = `<div class="marquee-track"><span>${row}</span><span>${row}</span><span>${row}</span><span>${row}</span></div>`;
      edge.parentElement?.insertBefore(band, edge);
      cleanups.push(() => band.remove());
    }

    const hero = document.querySelector<HTMLElement>("#home");
    if (hero && !hero.querySelector(".hero-glow")) {
      const glow = document.createElement("div");
      glow.className = "hero-glow";
      glow.setAttribute("aria-hidden", "true");
      hero.appendChild(glow);
      cleanups.push(() => glow.remove());
    }

    if (!reduce) {
      // Cursor ring
      if (fine) {
        const ring = document.createElement("div");
        ring.className = "cursor";
        ring.setAttribute("aria-hidden", "true");
        document.body.appendChild(ring);
        let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
        const loop = () => {
          x += (tx - x) * 0.2;
          y += (ty - y) * 0.2;
          ring.style.transform = `translate(${x}px, ${y}px)`;
          raf = requestAnimationFrame(loop);
        };
        const move = (e: PointerEvent) => {
          tx = e.clientX;
          ty = e.clientY;
          ring.classList.add("on");
          ring.classList.toggle("big", !!(e.target as Element).closest("a, button, .place-hit, .mitem"));
        };
        const out = () => ring.classList.remove("on");
        window.addEventListener("pointermove", move);
        document.addEventListener("pointerleave", out);
        raf = requestAnimationFrame(loop);
        cleanups.push(() => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", move); document.removeEventListener("pointerleave", out); ring.remove(); });
      }

      // Magnetic buttons
      if (fine) {
        document.querySelectorAll<HTMLElement>(".btn").forEach((el) => {
          const move = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            el.style.setProperty("--tx", `${((e.clientX - r.left) / r.width - 0.5) * 10}px`);
            el.style.setProperty("--ty", `${((e.clientY - r.top) / r.height - 0.5) * 8}px`);
          };
          const leave = () => {
            el.style.setProperty("--tx", "0px");
            el.style.setProperty("--ty", "0px");
          };
          el.addEventListener("pointermove", move);
          el.addEventListener("pointerleave", leave);
        });
      }

      // Closing-section parallax
      const closing = document.querySelector<HTMLElement>(".closing");
      const img = closing?.querySelector<HTMLElement>(".ph img");
      if (closing && img) {
        let ticking = false;
        const update = () => {
          const r = closing.getBoundingClientRect();
          if (r.bottom > 0 && r.top < window.innerHeight) {
            const p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
            img.style.setProperty("--py", String(Math.round(p * -60)));
          }
          ticking = false;
        };
        const onScroll = () => {
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
          }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        update();
        cleanups.push(() => window.removeEventListener("scroll", onScroll));
      }
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
