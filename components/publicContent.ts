import { clientLang } from "@/lib/lang";
import { translate } from "@/lib/i18n";

const tx = (english: string) => translate(clientLang(), english);
import { BACKEND_URL as API_BASE_URL } from "@/lib/config";
import { applyResized } from "@/lib/media";
import { eventImage, fallbackFeaturedEvent, upcomingEvents, type PublicEvent } from "@/components/site/upcomingEvents";
import { PLANS } from "@/components/site/data/plans";
import { getPlanBySlug, planSlug } from "@/components/site/plan-slug";
import { FEATURED_EVENT_SLUG } from "@/components/site/data/featured-event";

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

type PublicTestimonial = { id: number | string; author_name: string; author_role: string; quote: string };
type HomepageStat = { value: number; label: string; suffix: string; decimals: number };

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

function isTestimonial(value: unknown): value is PublicTestimonial {
  return isRecord(value)
    && (typeof value.id === "number" || typeof value.id === "string")
    && typeof value.author_name === "string"
    && typeof value.author_role === "string"
    && typeof value.quote === "string";
}

async function fetchSiteSettings(): Promise<HomepageStat[]> {
  const response = await fetch(new URL("/api/v1/site-settings/", API_BASE_URL), { cache: "no-store" });
  if (!response.ok) throw new Error(`Site settings request failed (${response.status}).`);
  const payload: unknown = await response.json();
  if (!isRecord(payload) || !Array.isArray(payload.homepage_stats)) throw new Error("Invalid site settings response.");
  return payload.homepage_stats.filter((s): s is HomepageStat => isRecord(s)
    && typeof s.value === "number" && typeof s.label === "string"
    && typeof s.suffix === "string" && typeof s.decimals === "number");
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
  if (!url.searchParams.has("page_size")) url.searchParams.set("page_size", "100");   // one request instead of one per 12 items
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
    applyResized(image, trip.cover_url, "(min-width:900px) 30vw, 90vw");
    image.alt = trip.title;
    image.loading = "lazy";
    image.decoding = "async";
    revealWhenLoaded(image);
    photo.append(image);
  }
  photo.append(element("span", "ptag", categoryLabel(category)));
  if (upcoming) photo.append(element("span", "badge", tx("Live")));

  const body = element("div", "ebody");
  body.append(element("span", "ecat", categoryLabel(category)));
  body.append(element("h3", undefined, trip.title));
  if (trip.summary) body.append(element("p", "blurb", trip.summary));

  if (upcoming && trip.next_departure) {
    const details = element("dl", "edl");
    const date = new Date(trip.next_departure);
    const dateText = Number.isNaN(date.getTime())
      ? tx("To be announced")
      : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
    const amount = trip.from_price === null ? Number.NaN : Number(trip.from_price);
    const price = Number.isFinite(amount)
      ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount)
      : tx("To be announced");

    details.append(
      element("dt", undefined, tx("Date")),
      element("dd", undefined, dateText),
      element("dt", undefined, tx("Price")),
      element("dd", undefined, price),
      element("dt", undefined, tx("Status")),
      element("dd", undefined, categoryLabel(trip.operational_status)),
    );
    body.append(details);
  }

  const link = element("span", "link", tx("View trip details"));
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
  const cover = eventImage(event);
  // Plan events seeded without an uploaded cover fall back to the bundled plan card photo.
  const planPhoto = cover ? null : getPlanBySlug(event.slug)?.photo ?? null;
  if (cover || planPhoto) {
    const image = element("img");
    if (cover) applyResized(image, cover, "(min-width:900px) 30vw, 90vw");
    else if (planPhoto) {
      image.src = `/${planPhoto.src.replace(/^\//, "")}`;
      if (planPhoto.srcSet) image.srcset = planPhoto.srcSet.replace(/(^|, )(?!\/|https?:)/g, "$1/");
      image.sizes = "(min-width:700px) 340px, 82vw";
    }
    image.alt = event.title;
    markPortraitPoster(image, photo);
    image.loading = "lazy";
    image.decoding = "async";
    revealWhenLoaded(image);
    photo.append(image);
  }
  photo.append(element("span", "ptag", categoryLabel(category)));
  if (event.is_featured) photo.append(element("span", "badge hot-event-badge", tx("Hot event")));
  else photo.append(element("span", "badge", tx("Upcoming")));

  const body = element("div", "ebody");
  body.append(element("span", "ecat", event.category || categoryLabel(category)));
  body.append(element("h3", undefined, event.title));
  if (event.summary) body.append(element("p", "blurb", event.summary));
  const details = element("dl", "edl");
  const date = event.next_date ? new Date(event.next_date) : null;
  const dateText = date && !Number.isNaN(date.getTime())
    ? `${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", ...(event.next_time_tbd ? {} : { timeStyle: "short" }), timeZone: "Asia/Kolkata" }).format(date)}${event.next_time_tbd ? ` · ${tx("Time to be confirmed")}` : ""}`
    : tx("Upcoming");
  const amount = Number(event.price);
  // 0 means the price is not set yet (upcoming plans).
  const price = Number.isFinite(amount) && amount > 0
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount)
    : tx("Ask for price");
  details.append(
    element("dt", undefined, tx("Date")), element("dd", undefined, dateText),
    element("dt", undefined, tx("Price")), element("dd", undefined, price),
  );
  body.append(details, element("span", "link", event.next_date ? tx("Book your spot") : tx("View plan")));
  card.append(photo, body);
  return card;
}

/** Portrait posters (e.g. event flyers) are shown whole instead of being cropped to the card's landscape frame. */
/**
 * Cards are built after the API responds, so Motion.tsx (which only tags images present on first paint) never sees
 * them. Without `is-loaded`, `.motion-ready .ph img` stays at opacity 0 behind the shimmer.
 */
function revealWhenLoaded(image: HTMLImageElement): void {
  const done = () => image.classList.add("is-loaded");
  if (image.complete && image.naturalWidth) done();
  else {
    image.addEventListener("load", done, { once: true });
    image.addEventListener("error", done, { once: true });
  }
}

function markPortraitPoster(image: HTMLImageElement, frame: HTMLElement): void {
  const check = () => { if (image.naturalHeight > image.naturalWidth * 1.05) frame.classList.add("ph-poster"); };
  if (image.complete && image.naturalWidth) check();
  else image.addEventListener("load", check, { once: true });
}

function renderEvents(events: PublicEvent[]): void {
  const visibleEvents = upcomingEvents(events);
  const fallback = fallbackFeaturedEvent(events);
  if (fallback) visibleEvents.unshift(fallback);

  const grid = document.getElementById("ev-grid");
  if (!grid) return;
  if (visibleEvents.length) {
    grid.replaceChildren(...visibleEvents.map(renderEventCard));
  } else {
    const empty = element("p", "ev-empty", tx("No upcoming events are scheduled right now. Check back soon, or follow @go_hyderabad on Instagram for the next one."));
    grid.replaceChildren(empty);
  }
  const count = document.getElementById("events-count");
  if (count) {
    count.textContent = visibleEvents.length === 1
      ? tx("1 upcoming event in Hyderabad")
      : tx("count.events").replace("{n}", String(visibleEvents.length || (clientLang() === "en" ? "No" : 0)));
  }
}

/** "Plan your next trip": published events with no date yet, in homepage plan order, with category chips. */
function renderPlans(events: PublicEvent[]): void {
  const section = document.getElementById("plans");
  const grid = document.getElementById("plans-grid");
  const chipBox = document.getElementById("plans-chips");
  if (!section || !grid || !chipBox) return;
  const order = new Map(PLANS.map((plan, i) => [plan.slug || planSlug(plan.title), i]));
  const plans = events
    .filter((event) => !event.next_date && event.slug !== FEATURED_EVENT_SLUG)
    .sort((a, b) => (order.get(a.slug) ?? 999) - (order.get(b.slug) ?? 999));
  if (!plans.length) { section.hidden = true; return; }

  const cards = plans.map(renderEventCard);
  grid.replaceChildren(...cards);

  const categories = new Map<string, string>();
  for (const event of plans) {
    const slug = event.category_slug || "events";
    if (!categories.has(slug)) categories.set(slug, event.category || categoryLabel(slug));
  }
  const chips = [["all", tx("All")] as [string, string], ...categories.entries()].map(([slug, label]) => {
    const chip = element("button", "chip", label);
    chip.type = "button";
    chip.dataset.chip = slug;
    chip.setAttribute("aria-pressed", String(slug === "all"));
    return chip;
  });
  const select = (slug: string) => {
    chips.forEach((chip) => chip.setAttribute("aria-pressed", String(chip.dataset.chip === slug)));
    cards.forEach((card) => { card.hidden = slug !== "all" && card.dataset.cat !== slug; });
    grid.scrollTo({ left: 0 });
  };
  chips.forEach((chip) => chip.addEventListener("click", () => select(chip.dataset.chip || "all")));
  chipBox.replaceChildren(...chips);
  section.hidden = false;
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
    const section = document.getElementById("upcoming-trips");
    if (section) section.hidden = false;
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
      applyResized(image, destination.cover_url, "96px", [384]);
      image.alt = destination.name;
      image.loading = "lazy";
      image.decoding = "async";
      revealWhenLoaded(image);
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
  const mapSub = document.querySelector(".map-sub");
  if (mapSub) mapSub.textContent = `${count} published destinations and escapes, pinned. Tap a pin or a name to see where it sits.`;
}

/** Admin → Settings → Business settings → homepage.stats. The section stays hidden when the list is empty. */
function renderStats(stats: HomepageStat[]): void {
  const section = document.getElementById("stats");
  const grid = document.getElementById("stats-grid");
  if (!section || !grid) return;
  if (!stats.length) { section.hidden = true; return; }
  const format = (n: number, d: number) => n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
  const numbers: { el: HTMLElement; stat: HomepageStat }[] = [];
  grid.replaceChildren(...stats.map((stat) => {
    const wrap = element("div", "stat");
    const num = element("b", "num", format(stat.value, stat.decimals) + stat.suffix);
    numbers.push({ el: num, stat });
    wrap.append(num, element("span", undefined, stat.label));
    return wrap;
  }));
  section.hidden = false;

  // Count up once when the numbers scroll into view (skipped for reduced motion).
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      const item = numbers.find((n) => n.el === entry.target);
      if (!item) return;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / 1900);
        item.el.textContent = format(item.stat.value * (1 - Math.pow(1 - p, 3)), item.stat.decimals) + item.stat.suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  numbers.forEach((n) => observer.observe(n.el));
}

/** Admin → Marketing → CMS → Testimonials (published only). The section stays hidden when there are none. */
function renderTestimonials(testimonials: PublicTestimonial[]): void {
  const section = document.getElementById("voices");
  const track = document.getElementById("voice-track");
  if (!section || !track) return;
  const items = testimonials.filter((t) => t.quote.trim() && t.author_name.trim());
  if (!items.length) { section.hidden = true; return; }
  track.replaceChildren(...items.map((t) => {
    const figure = element("figure", "voice");
    const quote = element("blockquote", undefined, `“${t.quote.trim()}”`);
    const caption = element("figcaption");
    const avatar = element("span", "avatar", t.author_name.trim().charAt(0).toUpperCase());
    avatar.setAttribute("aria-hidden", "true");
    const who = element("span");
    who.append(element("b", undefined, t.author_name.trim()));
    if (t.author_role.trim()) who.append(element("small", undefined, t.author_role.trim()));
    caption.append(avatar, who);
    figure.append(quote, caption);
    return figure;
  }));
  section.hidden = false;
  const controls = section.querySelector<HTMLElement>(".voice-ctrl");
  if (controls) controls.style.display = items.length < 2 ? "none" : "";
}

function setContentStatus(message: string): void {
  const status = document.getElementById("public-content-status");
  if (!status) return;
  status.hidden = !message;
  status.textContent = message;
}

export async function loadPublicContent(): Promise<void> {
  const results = await Promise.allSettled([
    fetchAll(`/api/v1/trips/?lang=${clientLang()}`, isTrip),
    fetchAll(`/api/v1/events/?lang=${clientLang()}`, isEvent),
    fetchAll(`/api/v1/destinations/?is_hyderabad_explore=true&lang=${clientLang()}`, isDestination),
    fetchAll(`/api/v1/testimonials/?lang=${clientLang()}`, isTestimonial),
    fetchSiteSettings(),
  ]);
  const notices: string[] = [];

  if (results[0].status === "fulfilled") {
    renderTrips(results[0].value);
  } else {
    console.error("Could not load published trips from the backend; the Upcoming trips section stays hidden.", results[0].reason);
  }

  if (results[1].status === "fulfilled") {
    renderEvents(results[1].value);
    renderPlans(results[1].value);
  } else {
    console.error("Could not load published events from the backend.", results[1].reason);
    notices.push("Live events are unavailable right now; showing the featured event.");
  }

  if (results[2].status === "fulfilled") {
    renderDestinations(results[2].value);
  } else {
    console.error("Could not load published destinations from the backend.", results[2].reason);
    notices.push("Live destinations are unavailable; the current map remains visible.");
  }

  if (results[3].status === "fulfilled") renderTestimonials(results[3].value);
  else console.error("Could not load testimonials; the section stays hidden.", results[3].reason);

  if (results[4].status === "fulfilled") renderStats(results[4].value);
  else console.error("Could not load homepage stats; the section stays hidden.", results[4].reason);

  setContentStatus(notices.join(" "));
}
