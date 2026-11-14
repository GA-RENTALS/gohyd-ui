import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Fraunces, Manrope } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import "./animations.css";
import "./sections.css";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_TITLE, SITE_URL, SOCIAL_PROFILES, absoluteUrl, jsonLd } from "@/lib/site";
import { LANGS } from "@/lib/lang";
import { serverLang } from "@/lib/lang-server";
import { LangProvider } from "@/components/site/LangProvider";
import { VisitorTracking } from "@/components/site/VisitorTracking";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  verification: { google: "Exkl0mtaKCiPYYeqJcOhdwGuPAObz5xVSf2" },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Hyderabad weekend trips", "things to do in Hyderabad", "Hyderabad events", "box cricket Hyderabad",
    "bike rides from Hyderabad", "treks near Hyderabad", "Hyderabad food walk", "meet new people Hyderabad",
    "weekend getaways Hyderabad", "GoHyderabad",
  ],
  icons: {
    icon: [{ url: "/assets/logo.png", type: "image/png" }, { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION, images: [OG_IMAGE.url] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  // Search Console: set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION to the code from the "HTML tag" method.
  // verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : undefined,
  category: "travel",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#12130e",
};

// Fonts are self-hosted by Next (downloaded at build time, served from our own domain, preloaded): no render-blocking
// request to Google Fonts and no cross-origin font errors.
const sans = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-sans", display: "swap" });
const display = Barlow_Condensed({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-display", display: "swap" });
const serif = Fraunces({ subsets: ["latin"], style: ["italic"], axes: ["opsz"], variable: "--font-serif", display: "swap" });

const siteJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    slogan: SITE_TAGLINE,
    description: "Weekend experiences and community in Hyderabad, India.",
    logo: absoluteUrl("/brand/gohyderabad-logo.png"),
    image: absoluteUrl(OG_IMAGE.url),
    areaServed: { "@type": "City", name: "Hyderabad" },
    address: { "@type": "PostalAddress", addressLocality: "Hyderabad", addressRegion: "Telangana", addressCountry: "IN" },
    sameAs: SOCIAL_PROFILES,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "en-IN",
    publisher: { "@id": `${SITE_URL}/#organization` },
  },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await serverLang();
  return (
    <html lang={LANGS.find((l) => l.code === lang)?.html ?? "en-IN"} className={`${sans.variable} ${display.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('motion-ready','motion-go')" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(siteJsonLd) }} />
      </head>
      <body><LangProvider lang={lang}>{children}<VisitorTracking /></LangProvider></body>
    </html>
  );
}
