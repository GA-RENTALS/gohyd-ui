import { cookies } from "next/headers";
import { LANG_COOKIE, toLang, type Lang } from "./lang";

/** Server side: the visitor's chosen language (English when none is set). */
export async function serverLang(): Promise<Lang> {
  try { return toLang((await cookies()).get(LANG_COOKIE)?.value); } catch { return "en"; }
}

/** Server components: `const t = await serverT();` then `t("English text")`. */
export async function serverT() {
  const { makeT } = await import("./i18n");
  return makeT(await serverLang());
}
