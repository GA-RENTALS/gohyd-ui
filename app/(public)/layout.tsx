import type { Metadata, Viewport } from "next";
import "lenis/dist/lenis.css";
import "./globals.css";
import "./animations.css";
import "./sections.css";

export const metadata: Metadata = {
  title: "GoHyderabad — Your Weekends, Reimagined",
  description:
    "GoHyderabad is a Hyderabad-based weekend experiences community. Ride out, play box cricket, find food and culture, explore hidden gems and meet your kind of people.",
  icons: { icon: "/assets/logo.png", apple: "/assets/logo.png" },
  openGraph: {
    siteName: "GoHyderabad",
    type: "website",
    title: "GoHyderabad — Your Weekends, Reimagined",
    description:
      "Discover a different side of Hyderabad. Ride out, play hard, explore hidden gems, and meet your kind of people.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#12130e",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "GoHyderabad",
  description: "Weekend experiences and community in Hyderabad, India.",
  logo: "assets/logo.png",
  sameAs: ["https://www.instagram.com/gohyderabad/", "https://www.instagram.com/goadventure.in/"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          as="image"
          href="/assets/img/hero-night-1920.jpg"
          imageSrcSet="/assets/img/hero-night-640.jpg 640w, /assets/img/hero-night-1200.jpg 1200w, /assets/img/hero-night-1920.jpg 1920w"
          imageSizes="100vw"
          fetchPriority="high"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@1,9..144,400;1,9..144,500&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('motion-ready');setTimeout(function(){document.documentElement.classList.add('motion-go')},5000)" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
