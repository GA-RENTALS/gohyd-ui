import type { MetadataRoute } from "next";
import { API_URL } from "@/lib/config";
import { SITE_URL } from "@/lib/site";
import { FEATURED_EVENT_SLUG, isFeaturedFallbackUpcoming } from "@/components/site/data/featured-event";

// Built per request from the live API so newly published trips, events and editorial content appear without a redeploy.
export const dynamic = "force-dynamic";

type Row = { slug: string; next_date?: string | null; next_departure?: string | null };

async function published(path: string): Promise<Row[] | null> {
  const rows: Row[] = [];
  let url: string | null = `${API_URL}${path}`;
  try {
    for (let page = 0; url && page < 20; page += 1) {
      const res: Response = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      const data: unknown = await res.json();
      if (Array.isArray(data)) return [...rows, ...(data as Row[])];
      const body = data as { results?: Row[]; next?: string | null };
      rows.push(...(body.results ?? []));
      url = body.next ?? null;
    }
    return rows;
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [trips, events, destinations, blogs] = await Promise.all([
    published("/trips/?lang=en"),
    published("/events/?lang=en"),
    published("/destinations/?lang=en"),
    published("/blogs/?lang=en"),
  ]);
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/trips`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/experiences`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/explore`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/destinations`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/blogs`, changeFrequency: "weekly", priority: 0.6 },
    ...["about", "how-it-works", "faqs", "contact", "corporate", "community", "membership"].map((slug) => ({
      url: `${SITE_URL}/${slug}`, changeFrequency: "monthly" as const, priority: 0.4,
    })),
  ];
  for (const trip of trips ?? []) {
    entries.push({ url: `${SITE_URL}/trips/${encodeURIComponent(trip.slug)}`, changeFrequency: "weekly", priority: trip.next_departure ? 0.8 : 0.5 });
  }
  for (const event of events ?? []) {
    entries.push({ url: `${SITE_URL}/events/${encodeURIComponent(event.slug)}`, changeFrequency: "weekly", priority: event.next_date ? 0.9 : 0.4 });
  }
  for (const destination of destinations ?? []) {
    entries.push({ url: `${SITE_URL}/destinations/${encodeURIComponent(destination.slug)}`, changeFrequency: "monthly", priority: 0.6 });
  }
  for (const blog of blogs ?? []) {
    entries.push({ url: `${SITE_URL}/blogs/${encodeURIComponent(blog.slug)}`, changeFrequency: "monthly", priority: 0.5 });
  }
  // The built-in Box Cricket page is live until the real event is published.
  if (!(events ?? []).some((e) => e.slug === FEATURED_EVENT_SLUG) && isFeaturedFallbackUpcoming()) {
    entries.push({ url: `${SITE_URL}/events/${FEATURED_EVENT_SLUG}`, changeFrequency: "daily", priority: 0.9 });
  }
  return entries;
}
