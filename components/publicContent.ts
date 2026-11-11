import { BACKEND_URL as API_BASE_URL } from "@/lib/config";
import { FEATURED_EVENT_PLAN, FEATURED_EVENT_SLUG, FEATURED_EVENT_STARTS_AT, FEATURED_EVENT_WHATSAPP } from "@/components/site/data/featured-event";

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

type PublicEvent = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  category_slug: string | null;
  price: string | number;
  cover_url: string | null;
  next_date: string | null;
  next_time_tbd?: boolean;
  is_featured?: boolean;
  booking_whatsapp_number?: string;
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

function isEvent(value: unknown): value is PublicEvent {
  return isRecord(value)
    && typeof value.slug === "string"
    && typeof value.title === "string"
    && typeof value.summary === "string"
    && typeof value.category === "string"
    && isNullableString(value.category_slug)
    && (typeof value.price === "string" || typeof value.price === "number")
    && isNullableString(value.cover_url)
    && isNullableString(value.next_date)
    && (value.next_time_tbd === undefined || typeof value.next_time_tbd === "boolean")
    && (value.is_featured === undefined || typeof value.is_featured === "boolean")
    && (value.booking_whatsapp_number === undefined || typeof value.booking_whatsapp_number === "string");
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
      throw new Error(`Backend request failed at ${url.origin}${url.pathname} (${response.status} ${response.statusText}).`);
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
  const card = element("a", `ecard${upcoming ? " up-card" : ""}`);
  card.href = `/trips/${encodeURIComponent(trip.slug)}`;
  card.setAttribute("aria-label", `View ${trip.title} trip details`);
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

  const link = element("span", "link", "View trip details");
  body.append(link);
  card.append(photo, body);
  return card;
}

function renderEventCard(event: PublicEvent): HTMLElement {
  const category = event.category_slug || "events";
  const card = element("a", "ecard");
  card.href = `/events/${encodeURIComponent(event.slug)}`;
  card.setAttribute("aria-label", `View ${event.title} event details`);
  card.dataset.cat = category;

  const photo = element("div", "ph");
  photo.dataset.label = event.title;
  if (event.cover_url) {
    const image = element("img");
    image.src = event.cover_url;
    image.alt = event.title;
    image.loading = "lazy";
    image.decoding = "async";
    photo.append(image);
  }
  photo.append(element("span", "ptag", categoryLabel(category)));
  if (event.is_featured) photo.append(element("span", "badge hot-event-badge", "Hot event"));
  else if (event.next_date) photo.append(element("span", "badge", "Upcoming"));

  const body = element("div", "ebody");
  body.append(element("span", "ecat", event.category || categoryLabel(category)));
  body.append(element("h3", undefined, event.title));
  if (event.summary) body.append(element("p", "blurb", event.summary));
  const details = element("dl", "edl");
  const date = event.next_date ? new Date(event.next_date) : null;
  const dateText = date && !Number.isNaN(date.getTime())
    ? `${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", ...(event.next_time_tbd ? {} : { timeStyle: "short" }), timeZone: "Asia/Kolkata" }).format(date)}${event.next_time_tbd ? " · Time to be confirmed" : ""}`
    : "Date to be announced";
  const amount = Number(event.price);
  const price = Number.isFinite(amount)
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount)
    : "To be confirmed";
  details.append(
    element("dt", undefined, "Date"), element("dd", undefined, dateText),
    element("dt", undefined, "Price"), element("dd", undefined, price),
  );
  body.append(details, element("span", "link", "Explore event"));
  card.append(photo, body);
  return card;
}

function renderEvents(events: PublicEvent[]): void {
  if (!events.length) return;
  const featuredEvent: PublicEvent = {
    slug: FEATURED_EVENT_SLUG,
    title: FEATURED_EVENT_PLAN.title,
    summary: FEATURED_EVENT_PLAN.summary,
    category: "Sports · KPHB, Hyderabad",
    category_slug: "sports",
    price: 499,
    cover_url: "/assets/img/cricket-morning-1200.jpg",
    next_date: FEATURED_EVENT_STARTS_AT,
    next_time_tbd: true,
    is_featured: true,
    booking_whatsapp_number: FEATURED_EVENT_WHATSAPP,
  };
  const liveFeatured = events.find((event) => event.slug === FEATURED_EVENT_SLUG);
  const visibleEvents = [liveFeatured || featuredEvent, ...events.filter((event) => event.slug !== FEATURED_EVENT_SLUG)];
  document.getElementById("ev-grid")?.replaceChildren(...visibleEvents.map(renderEventCard));
  const eventCount = document.querySelector(".events .rail-title span");
  if (eventCount) eventCount.textContent = `${visibleEvents.length} events listed`;
  const notice = document.querySelector(".notice span");
  if (notice) {
    notice.textContent = "Published events are listed here. Open an event to review its itinerary and send a booking request; our team will confirm the date and availability.";
  }

  const chips = document.querySelector(".chips");
  if (!chips) return;
  const existing = new Set(Array.from(chips.querySelectorAll<HTMLButtonElement>("[data-chip]")).map((chip) => chip.dataset.chip));
  for (const category of new Set(events.map((event) => event.category_slug).filter((slug): slug is string => Boolean(slug)))) {
    if (existing.has(category)) continue;
    const chip = element("button", "chip", categoryLabel(category));
    chip.type = "button";
    chip.dataset.chip = category;
    chip.setAttribute("aria-pressed", "false");
    chips.append(chip);
  }
}

function renderTrips(trips: PublicTrip[]): boolean {
  const visibleTrips = trips.filter((trip) => !["CANCELLED", "COMPLETED"].includes(trip.operational_status));
  if (!visibleTrips.length) return false;

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
    fetchAll("/api/v1/events/?lang=en", isEvent),
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
    renderEvents(results[1].value);
  } else {
    console.error("Could not load published events from the backend.", results[1].reason);
    notices.push("Live events are unavailable; plan formats remain visible.");
  }

  if (results[2].status === "fulfilled") {
    renderDestinations(results[2].value);
  } else {
    console.error("Could not load published destinations from the backend.", results[2].reason);
    notices.push("Live destinations are unavailable; the current map remains visible.");
  }

  setContentStatus(notices.join(" "));
}
