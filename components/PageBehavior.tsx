"use client";

import { useEffect } from "react";
import { initPage } from "./initPage";
import { loadPublicContent } from "./publicContent";

/** Loads the live homepage content straight away, then wires up the page. The map loads its own library later, when it is near the screen. */
export default function PageBehavior() {
  useEffect(() => {
    let active = true;
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
    return () => { active = false; };
  }, []);

  return null;
}
