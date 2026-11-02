"use client";

import { useEffect } from "react";
import { initPage } from "./initPage";

const LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
const LEAFLET_JS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";

export default function PageBehavior() {
  useEffect(() => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = LEAFLET_CSS;
    document.body.appendChild(css);

    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.onload = initPage;
    script.onerror = initPage; // initPage shows the map fallback message when window.L is missing
    document.body.appendChild(script);
  }, []);

  return null;
}
