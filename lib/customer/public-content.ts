import { API_URL } from "@/lib/config";
import { serverLang } from "@/lib/lang-server";

export type PublicDestination = {
  id: string;
  slug: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  distance_km_from_city: number | null;
  is_hyderabad_explore: boolean;
  name: string;
  summary: string;
  body: string;
  seo: { title?: string; description?: string };
  cover_url: string | null;
};

export type PublicBlog = {
  id: string;
  slug: string;
  published_at: string | null;
  title: string;
  summary: string;
  body: string;
};

export type PublicPage = {
  slug: string;
  kind: string;
  title: string;
  body: string;
  blocks: Record<string, unknown>;
};

export type PublicFaq = { id: number; question: string; answer: string };
export type PublicEvent = { id: string; slug: string; title: string; summary: string; cover_url: string | null; next_date: string | null };

async function getJson<T>(path: string): Promise<T | null> {
  const response = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Public content request failed (${response.status})`);
  return response.json() as Promise<T>;
}

async function getCollection<T>(path: string): Promise<T[]> {
  const rows: T[] = [];
  let url: string | null = `${API_URL}${path}`;
  for (let page = 0; url && page < 20; page += 1) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Public content request failed (${response.status})`);
    const data: unknown = await response.json();
    if (Array.isArray(data)) return [...rows, ...(data as T[])];
    const paginated = data as { results?: T[]; next?: string | null };
    rows.push(...(paginated.results ?? []));
    url = paginated.next ?? null;
  }
  return rows;
}

const L = async (lang?: string) => lang ?? (await serverLang());
export const listDestinations = async (lang?: string) => getCollection<PublicDestination>(`/destinations/?lang=${await L(lang)}`);
export const listExploreDestinations = async (lang?: string) => getCollection<PublicDestination>(`/destinations/?is_hyderabad_explore=true&lang=${await L(lang)}`);
export const getDestination = async (slug: string, lang?: string) => getJson<PublicDestination>(`/destinations/${encodeURIComponent(slug)}/?lang=${await L(lang)}`);
export const listBlogs = async (lang?: string) => getCollection<PublicBlog>(`/blogs/?lang=${await L(lang)}`);
export const getBlog = async (slug: string, lang?: string) => getJson<PublicBlog>(`/blogs/${encodeURIComponent(slug)}/?lang=${await L(lang)}`);
export const getCmsPage = async (slug: string, lang?: string) => getJson<PublicPage>(`/pages/${encodeURIComponent(slug)}/?lang=${await L(lang)}`);
export const listFaqs = async (lang?: string) => getCollection<PublicFaq>(`/faqs/?lang=${await L(lang)}`);
export const listEvents = async (lang?: string) => getCollection<PublicEvent>(`/events/?lang=${await L(lang)}`);
export type MembershipPlan = { id: number; name: string; price: string; duration_days: number; discount_percent: number; benefits: string[] };
/** Active plans, cheapest first (GET /membership-plans/). */
export const listMembershipPlans = async () => (await getJson<MembershipPlan[]>("/membership-plans/")) ?? [];

/** Render CMS rich text as safe, readable plain text rather than injecting stored HTML into the page. */
export function contentText(value: string): string {
  return value
    .replace(/<\/(p|div|h[1-6]|li|br|blockquote)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
