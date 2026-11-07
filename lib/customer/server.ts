import { API_URL } from "@/lib/config";
import type { TripDetail, TripSummary } from "./types";

/** Public, signed-out reads done on the server so trip pages arrive fully rendered (good for search engines and slow phones). */
async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Backend answered ${res.status}`);
    return (await res.json()) as T;
  } catch (error) {
    console.error(`Could not load ${path}`, error);
    throw error;
  }
}

export async function listTrips(): Promise<TripSummary[]> {
  const data = await getJson<{ results: TripSummary[]; next: string | null }>("/trips/?lang=en");
  return data?.results ?? [];
}

export async function getTrip(slug: string): Promise<TripDetail | null> {
  return getJson<TripDetail>(`/trips/${encodeURIComponent(slug)}/?lang=en`);
}
