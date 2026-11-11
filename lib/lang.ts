/** Content languages. Staff-written content (trips, events, places, blogs, pages) is translated in the CMS; the API
 *  falls back to English when a translation is missing. The choice is kept in a cookie so server pages can read it. */
export const LANGS = [
  { code: "en", label: "English", short: "EN", html: "en-IN" },
  { code: "te", label: "తెలుగు", short: "తె", html: "te-IN" },
  { code: "hi", label: "हिन्दी", short: "हि", html: "hi-IN" },
] as const;
export type Lang = (typeof LANGS)[number]["code"];
export const LANG_COOKIE = "gh_lang";

export const toLang = (value: string | undefined | null): Lang =>
  (LANGS.find((l) => l.code === value)?.code ?? "en") as Lang;

/** Browser side: the visitor's chosen language. */
export function clientLang(): Lang {
  if (typeof document === "undefined") return "en";
  return toLang(document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=([^;]+)`))?.[1]);
}
