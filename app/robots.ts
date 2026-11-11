import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** /robots.txt: crawl the public site; keep staff, customer and API pages out. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/checkout", "/login", "/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
