import { BACKEND_URL as API_BASE_URL } from "@/lib/config";

type PublicTrip = {
  slug: string;
  title: string;
  summary: string;
  categories: string[];
  operational_status: string;
  next_departure: string | null;
  from_price: string | number | null;
  cover_url: string | null;
};

type PublicDestination = {
  slug: string;
  region: string;
  latitude: string | number | null;
  longitude: string | number | null;
  distance_km_from_city: number | null;
  name: string;
  summary: string;
  body: string;
  cover_url: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isTrip(value: unknown): value is PublicTrip {
  return isRecord(value)
    && typeof value.slug === "string"
    && typeof value.title === "string"
    && typeof value.summary === "string"
    && Array.isArray(value.categories)
    && value.categories.every((category) => typeof category === "string")
    && typeof value.operational_status === "string"
    && isNullableString(value.next_departure)
    && (value.from_price === null || typeof value.from_price === "string" || typeof value.from_price === "number")
    && isNullableString(value.cover_url);
}

function isDestination(value: unknown): value is PublicDestination {
  return isRecord(value)
    && typeof value.slug === "string"
    && typeof value.region === "string"
    && (typeof value.latitude === "number" || typeof value.latitude === "string" || value.latitude === null)
    && (typeof value.longitude === "number" || typeof value.longitude === "string" || value.longitude === null)
    && (typeof value.distance_km_from_city === "number" || value.distance_km_from_city === null)
    && typeof value.name === "string"
    && typeof value.summary === "string"
    && typeof value.body === "string"
    && isNullableString(value.cover_url);
}

async function fetchAll<T>(path: string, isItem: (value: unknown) => value is T): Promise<T[]> {
  const base = new URL(API_BASE_URL);
  let url = new URL(path, base);
  const visited = new Set<string>();
  const items: T[] = [];

  while (true) {
    if (url.origin !== base.origin) {
      throw new Error("The backend returned a pagination URL on an unexpected origin.");
    }
    if (visited.has(url.href)) {
      throw new Error("The backend returned a repeated pagination URL.");
    }
    visited.add(url.href);

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Backend request failed (${response.status} ${response.statusText}).`);
    }

    const payload: unknown = await response.json();
    if (Array.isArray(payload)) {
      if (!payload.every(isItem)) throw new Error("The backend returned an invalid content item.");
      items.push(...payload);
      return items;
    }
    if (!isRecord(payload) || !Array.isArray(payload.results) || !payload.results.every(isItem)) {
      throw new Error("The backend returned an invalid paginated response.");
    }

    items.push(...payload.results);
    if (payload.next === null) return items;
    if (typeof payload.next !== "string") {
      throw new Error("The backend returned an invalid pagination link.");
    }
    url = new URL(payload.next, url);
  }
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function categoryLabel(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function renderTripCard(trip: PublicTrip, upcoming: boolean): HTMLElement {
  const category = trip.categories[0] || "experience";
  const card = element("article", `ecard${upcoming ? " up-card" : ""}`);
  card.dataset.cat = category;

  const photo = element("div", "ph");
  photo.dataset.label = trip.title;
  if (trip.cover_url) {
    const image = element("img");
    image.src = trip.cover_url;
    image.alt = trip.title;
    image.loading = "lazy";
    image.decoding = "async";
    photo.append(image);
  }
  photo.append(element("span", "ptag", categoryLabel(category)));
  if (upcoming) photo.append(element("span", "badge", "Live"));

  const body = element("div", "ebody");
  body.append(element("span", "ecat", categoryLabel(category)));
  body.append(element("h3", undefined, trip.title));
  if (trip.summary) body.append(element("p", "blurb", trip.summary));

  if (upcoming && trip.next_departure) {
    const details = element("dl", "edl");
    const date = new Date(trip.next_departure);
    const dateText = Number.isNaN(date.getTime())
      ? "To be announced"
      : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
    const amount = trip.from_price === null ? Number.NaN : Number(trip.from_price);
    const price = Number.isFinite(amount)
      ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount)
      : "To be announced";

    details.append(
      element("dt", undefined, "Date"),
      element("dd", undefined, dateText),
      element("dt", undefined, "Price"),
      element("dd", undefined, price),
      element("dt", undefined, "Status"),
      element("dd", undefined, categoryLabel(trip.operational_status)),
    );
    body.append(details);
  }

  const link = element("a", "link", "Follow for booking updates");
  link.href = "https://www.instagram.com/gohyderabad/";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  body.append(link);
  card.append(photo, body);
  return card;
}

function renderTrips(trips: PublicTrip[]): boolean {
  const visibleTrips = trips.filter((trip) => !["CANCELLED", "COMPLETED"].includes(trip.operational_status));
  if (!visibleTrips.length) return false;

  const eventGrid = document.getElementById("ev-grid");
  eventGrid?.replaceChildren(...visibleTrips.map((trip) => renderTripCard(trip, false)));
  const eventCount = document.querySelector(".events .rail-title span");
  if (eventCount) eventCount.textContent = `${visibleTrips.length} published`;
  const notice = document.querySelector(".notice span");
  if (notice) {
    notice.textContent = "Published trips are listed here. Upcoming dates and prices are provided by GoHyderabad; follow the booking updates for current availability.";
  }

  const chips = document.querySelector(".chips");
  if (chips) {
    const existing = new Set(
      Array.from(chips.querySelectorAll<HTMLButtonElement>("[data-chip]")).map((chip) => chip.dataset.chip),
    );
    const categories = new Set(visibleTrips.flatMap((trip) => trip.categories));
    for (const category of categories) {
      if (!existing.has(category)) {
        const chip = element("button", "chip", categoryLabel(category));
        chip.type = "button";
        chip.dataset.chip = category;
        chip.setAttribute("aria-pressed", "false");
        chips.append(chip);
      }
    }
  }

  const upcoming = visibleTrips
    .map((trip) => ({ trip, departure: trip.next_departure ? Date.parse(trip.next_departure) : Number.NaN }))
    .filter(({ trip, departure }) => ["OPEN", "SOLD_OUT"].includes(trip.operational_status)
      && Number.isFinite(departure)
      && departure > Date.now())
    .sort((a, b) => a.departure - b.departure)
    .map(({ trip }) => trip);
  if (upcoming.length) {
    document.getElementById("upcomingRail")?.replaceChildren(
      ...upcoming.slice(0, 6).map((trip) => renderTripCard(trip, true)),
    );
  }
  return upcoming.length > 0;
}

function haversineDistanceFromHyderabad(latitude: number, longitude: number): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const lat1 = radians(17.385);
  const lat2 = radians(latitude);
  const deltaLat = lat2 - lat1;
  const deltaLng = radians(longitude - 78.4867);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function renderDestinations(destinations: PublicDestination[]): void {
  const places = destinations.filter((destination) => {
    if (destination.latitude === null || destination.longitude === null) return false;
    const latitude = Number(destination.latitude);
    const longitude = Number(destination.longitude);
    return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
      && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
  });
  if (!places.length) return;

  const list = document.getElementById("map-list");
  if (!list) return;

  const rows = places.map((destination) => {
    const latitude = Number(destination.latitude);
    const longitude = Number(destination.longitude);
    const text = destination.summary || destination.body;
    const row = element("li");
    const link = element("a", "mitem");
    link.href = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.dataset.name = destination.name;
    link.dataset.area = destination.region;
    link.dataset.lat = String(latitude);
    link.dataset.lng = String(longitude);
    link.dataset.text = text;
    link.dataset.group = destination.region === "Old City"
      ? "old"
      : (destination.distance_km_from_city ?? haversineDistanceFromHyderabad(latitude, longitude)) > 30 ? "esc" : "";

    const thumbnail = element("span", "mthumb ph");
    thumbnail.dataset.label = destination.name;
    if (destination.cover_url) {
      const image = element("img");
      image.src = destination.cover_url;
      image.alt = destination.name;
      image.loading = "lazy";
      image.decoding = "async";
      thumbnail.append(image);
    }

    const label = element("span");
    label.append(element("b", undefined, destination.name), element("small", undefined, destination.region));
    link.append(thumbnail, label);
    row.append(link);
    return row;
  });
  list.replaceChildren(...rows);

  const count = places.length;
  const countLine = document.querySelector(".count-line");
  if (countLine) countLine.textContent = `${count} published destinations around Hyderabad`;
  const mapSub = document.querySelector(".map-sub");
  if (mapSub) mapSub.textContent = `${count} published destinations and escapes, pinned. Tap a pin or a name to see where it sits.`;
}

function setContentStatus(message: string): void {
  const status = document.getElementById("public-content-status");
  if (!status) return;
  status.hidden = !message;
  status.textContent = message;
}

export async function loadPublicContent(): Promise<void> {
  const results = await Promise.allSettled([
    fetchAll("/api/v1/trips/?lang=en", isTrip),
    fetchAll("/api/v1/destinations/?is_hyderabad_explore=true&lang=en", isDestination),
  ]);
  const notices: string[] = [];

  if (results[0].status === "fulfilled") {
    const hasUpcoming = renderTrips(results[0].value);
    if (results[0].value.length && !hasUpcoming) {
      notices.push("No published trip has a future departure yet; the clearly labelled preview cards remain visible.");
    }
  } else {
    console.error("Could not load published trips from the backend.", results[0].reason);
    notices.push("Live trips are unavailable; preview cards remain visible.");
  }

  if (results[1].status === "fulfilled") {
    renderDestinations(results[1].value);
  } else {
    console.error("Could not load published destinations from the backend.", results[1].reason);
    notices.push("Live destinations are unavailable; the current map remains visible.");
  }

  setContentStatus(notices.join(" "));
}
