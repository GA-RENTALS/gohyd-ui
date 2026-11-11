/**
 * Public site identity used for SEO: canonical URLs, sitemap, Open Graph and structured data.
 * NEXT_PUBLIC_SITE_URL overrides the domain (e.g. for a staging copy); it is read at build time.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://hyderabad.goadventure.in").replace(/\/$/, "");
export const SITE_NAME = "GoHyderabad";
export const SITE_TAGLINE = "Meet · Explore · Experience";
export const SITE_TITLE = "GoHyderabad — Weekend Trips, Events & Experiences in Hyderabad";
export const SITE_DESCRIPTION =
  "GoHyderabad is a Hyderabad community for weekend experiences: bike rides, treks, box cricket, food walks, culture and hidden gems. Book upcoming trips and events and meet your kind of people.";
export const OG_IMAGE = { url: "/og-image.jpg", width: 1200, height: 630, alt: "GoHyderabad — Meet · Explore · Experience" };
export const SOCIAL_PROFILES = ["https://www.instagram.com/gohyderabad/", "https://www.instagram.com/goadventure.in/"];

/** Absolute URL for a path or an already-absolute URL (API cover images are absolute). */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}/${pathOrUrl.replace(/^\//, "")}`;
}

/** Plain text for meta descriptions: strips tags, collapses spaces, cuts at ~160 characters on a word boundary. */
export function metaDescription(...candidates: (string | null | undefined)[]): string | undefined {
  const text = candidates.find((c) => c && c.trim())?.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  if (text.length <= 160) return text;
  const cut = text.slice(0, 157);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 120 ? cut.lastIndexOf(" ") : 157)}…`;
}

/** Serialise JSON-LD safely inside a <script> tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

type PageSeo = {
  /** Page title without the " | GoHyderabad" suffix (the layout template adds it). Omit for the homepage. */
  title?: string;
  description?: string;
  /** Path of the canonical URL, e.g. "/events/box-cricket". */
  path: string;
  /** Absolute or site-relative image URL; falls back to the site sharing image. */
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article";
  /** Keep the page out of search results (still followable). */
  noindex?: boolean;
};

/**
 * Full metadata for one page. Next.js replaces (does not merge) nested objects such as `openGraph`, so every page
 * builds the whole set here instead of relying on the layout for part of it.
 */
export function pageMetadata({ title, description, path, image, imageAlt, type = "website", noindex }: PageSeo): import("next").Metadata {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_TITLE;
  const desc = description || SITE_DESCRIPTION;
  const images = image
    ? [{ url: absoluteUrl(image), alt: imageAlt || title || SITE_NAME }]
    : [{ ...OG_IMAGE, url: absoluteUrl(OG_IMAGE.url) }];
  return {
    ...(title ? { title } : { title: { absolute: SITE_TITLE } }),
    description: desc,
    alternates: { canonical: path },
    openGraph: { type, siteName: SITE_NAME, locale: "en_IN", url: path, title: fullTitle, description: desc, images },
    twitter: { card: "summary_large_image", title: fullTitle, description: desc, images: images.map((i) => i.url) },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
