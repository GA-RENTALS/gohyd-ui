import {
  FEATURED_EVENT_PLAN, FEATURED_EVENT_POSTER, FEATURED_EVENT_SLUG, FEATURED_EVENT_STARTS_AT, FEATURED_EVENT_WHATSAPP,
  isFeaturedFallbackUpcoming,
} from "./data/featured-event";

/** One row of GET /api/v1/events/ (list serializer). */
export type PublicEvent = {
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
  show_in_popup?: boolean;
  next_seats_left?: number | null;
  popup_order?: number;
  popup_banner_url?: string | null;
};

/** Cover image for an event, falling back to the bundled poster for the featured event until one is uploaded. */
export function eventImage(event: Pick<PublicEvent, "slug" | "cover_url"> & { popup_banner_url?: string | null }, preferBanner = false): string | null {
  const fromApi = preferBanner ? event.popup_banner_url || event.cover_url : event.cover_url;
  return fromApi || (event.slug === FEATURED_EVENT_SLUG ? FEATURED_EVENT_POSTER : null);
}

/** Published events that still have a future date, soonest first. The API already drops past schedules. */
export function upcomingEvents(events: PublicEvent[]): PublicEvent[] {
  return events
    .filter((event) => event.next_date && Number.isFinite(Date.parse(event.next_date)))
    .sort((a, b) => Date.parse(a.next_date as string) - Date.parse(b.next_date as string));
}

/**
 * The local Box Cricket card, used only until staff publish an Event with the same slug.
 * Pass `null` when the API could not be reached.
 */
export function fallbackFeaturedEvent(events: PublicEvent[] | null): PublicEvent | null {
  if (events?.some((event) => event.slug === FEATURED_EVENT_SLUG)) return null;
  if (!isFeaturedFallbackUpcoming()) return null;
  return {
    slug: FEATURED_EVENT_SLUG,
    title: FEATURED_EVENT_PLAN.title,
    summary: FEATURED_EVENT_PLAN.summary,
    category: FEATURED_EVENT_PLAN.eyebrow,
    category_slug: "sports",
    price: 499,
    cover_url: FEATURED_EVENT_POSTER,
    next_date: FEATURED_EVENT_STARTS_AT,
    next_time_tbd: false,
    is_featured: true,
    booking_whatsapp_number: FEATURED_EVENT_WHATSAPP,
    show_in_popup: true,
    popup_order: 0,
    popup_banner_url: FEATURED_EVENT_POSTER,
  };
}

/** Events staff switched on for the homepage popup, in popup order then date. */
export function popupEvents(events: PublicEvent[] | null): PublicEvent[] {
  const live = upcomingEvents(events ?? [])
    .filter((event) => event.show_in_popup)
    .sort((a, b) => (a.popup_order ?? 0) - (b.popup_order ?? 0));
  const fallback = fallbackFeaturedEvent(events);
  return fallback ? [fallback, ...live] : live;
}

export function eventDateLabel(event: PublicEvent): string {
  if (!event.next_date) return "Date to be announced";
  const date = new Date(event.next_date);
  if (Number.isNaN(date.getTime())) return "Date to be announced";
  const formatted = new Intl.DateTimeFormat("en-IN", {
    weekday: "short", day: "numeric", month: "short",
    ...(event.next_time_tbd ? {} : { hour: "numeric", minute: "2-digit" }),
    timeZone: "Asia/Kolkata",
  }).format(date);
  return formatted;
}

export function eventPriceLabel(event: PublicEvent): string {
  const amount = Number(event.price);
  if (!Number.isFinite(amount) || amount <= 0) return "Free / to be confirmed";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}
