"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Lang } from "@/lib/lang";
import { makeT, type T } from "@/lib/i18n";

const LangContext = createContext<Lang>("en");

/** Set once in the root layout from the language cookie, so server and browser render the same text. */
export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

export function useT(): T {
  const lang = useLang();
  return useMemo(() => makeT(lang), [lang]);
}
