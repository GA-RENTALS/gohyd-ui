import type { MetadataRoute } from "next";
import { API_URL } from "@/lib/config";
import { SITE_URL } from "@/lib/site";
import { FEATURED_EVENT_SLUG, isFeaturedFallbackUpcoming } from "@/components/site/data/featured-event";

// Built per request from the live API so newly published trips and events appear without a redeploy.
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
  const [trips, events] = await Promise.all([published("/trips/?lang=en"), published("/events/?lang=en")]);
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/trips`, changeFrequency: "daily", priority: 0.8 },
  ];
  for (const trip of trips ?? []) {
    entries.push({ url: `${SITE_URL}/trips/${encodeURIComponent(trip.slug)}`, changeFrequency: "weekly", priority: trip.next_departure ? 0.8 : 0.5 });
  }
  for (const event of events ?? []) {
    entries.push({ url: `${SITE_URL}/events/${encodeURIComponent(event.slug)}`, changeFrequency: "weekly", priority: event.next_date ? 0.9 : 0.4 });
  }
  // The built-in Box Cricket page is live until the real event is published.
  if (!(events ?? []).some((e) => e.slug === FEATURED_EVENT_SLUG) && isFeaturedFallbackUpcoming()) {
    entries.push({ url: `${SITE_URL}/events/${FEATURED_EVENT_SLUG}`, changeFrequency: "daily", priority: 0.9 });
  }
  return entries;
}
