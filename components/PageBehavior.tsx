"use client";

import { useEffect } from "react";
import { initPage } from "./initPage";
import { loadPublicContent } from "./publicContent";

const LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
const LEAFLET_JS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";

export default function PageBehavior() {
  useEffect(() => {
    let active = true;
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = LEAFLET_CSS;
    document.body.appendChild(css);

    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    const initializePage = () => {
      if (!active) return;
      void loadPublicContent().catch((error: unknown) => {
        console.error("Could not initialize homepage content.", error);
        const status = document.getElementById("public-content-status");
        if (status) {
          status.hidden = false;
          status.textContent = "Live content could not be initialized; the homepage preview remains visible.";
        }
      }).finally(() => {
        if (active) initPage();
      });
    };
    script.onload = initializePage;
    script.onerror = initializePage;
    document.body.appendChild(script);

    return () => {
      active = false;
      css.remove();
      script.remove();
    };
  }, []);

  return null;
}
