"use client";
import { useEffect, useState } from "react";
import { LANGS, LANG_COOKIE, clientLang, type Lang } from "@/lib/lang";

/** EN / తె / हि. Saves the choice for a year and reloads so every page section is fetched in that language. */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => setLang(clientLang()), []);

  function choose(next: Lang) {
    if (next === lang) return;
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  }

  return (
    <div className={`lang-switch ${className}`} role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button key={l.code} type="button" lang={l.html} aria-pressed={lang === l.code} title={l.label} onClick={() => choose(l.code)}>
          {l.short}
        </button>
      ))}
    </div>
  );
}
