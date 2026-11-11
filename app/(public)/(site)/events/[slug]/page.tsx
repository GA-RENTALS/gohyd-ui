import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventEnquiryPanel } from "@/components/booking/EventEnquiryPanel";
import { MobileBookBar } from "@/components/booking/MobileBookBar";
import { getEvent } from "@/lib/customer/server";
import type { EventDetail } from "@/lib/customer/types";
import { getPlanBySlug } from "@/components/site/plan-slug";
import { money } from "@/lib/customer/format";
import { FEATURED_EVENT_SLUG, FEATURED_EVENT_STARTS_AT, FEATURED_EVENT_WHATSAPP } from "@/components/site/data/featured-event";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

type EventPageData = Omit<EventDetail, "id" | "category_slug"> & { is_live: boolean };

async function loadPageData(slug: string): Promise<EventPageData | null> {
  const event = await getEvent(slug).catch(() => null);
  if (event) return { ...event, is_live: true };

  const plan = getPlanBySlug(slug);
  if (!plan) return null;
  const featured = slug === FEATURED_EVENT_SLUG;
  return {
    slug,
    title: plan.title,
    summary: plan.summary,
    body: featured
      ? "Meet new people through a community box cricket play day in KPHB. The flyer lists three pool-play matches, 10 overs per match, and about three hours of play."
      : "",
    category: plan.eyebrow,
    price: featured ? "499.00" : null,
    cover_url: `/${plan.photo.src.replace(/^\//, "")}`,
    next_date: featured ? FEATURED_EVENT_STARTS_AT : null,
    next_time_tbd: featured,
    is_featured: Boolean(plan.is_hot),
    booking_whatsapp_number: featured ? FEATURED_EVENT_WHATSAPP : "",
    venue_name: featured ? "KPHB" : "",
    venue_address: featured ? "KPHB, Hyderabad" : "",
    schedules: featured ? [{ id: "box-cricket-fixed-date", starts_at: FEATURED_EVENT_STARTS_AT, ends_at: null, capacity: 15, is_date_locked: true, time_tbd: true }] : [],
    itineraries: featured ? [{ id: 1, day_number: 1, title: "Pool play", items: [{ id: 1, time_label: "About 3 hours", text: "Three matches in pool play, with 10 overs per match." }] }] : [],
    things_to_bring: [],
    inclusions: [],
    exclusions: [],
    is_live: false,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await loadPageData(slug);
  if (!event) return { title: "Event not found · GoHyderabad" };
  return {
    title: `${event.title} · GoHyderabad`,
    description: event.summary || undefined,
    openGraph: { title: event.title, description: event.summary || undefined, images: event.cover_url ? [event.cover_url] : undefined },
  };
}

const sections = [
  { id: "event-about", label: "About" },
  { id: "event-itinerary", label: "Itinerary" },
  { id: "event-bring", label: "Things to bring" },
  { id: "event-includes", label: "Includes" },
  { id: "event-excludes", label: "Excludes" },
];

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await loadPageData(slug);
  if (!event) notFound();

  return (
    <div className="wrap">
      <div className="eyebrow">{event.is_live || event.is_featured ? "Event" : "Plan"}</div>
      <h1 className="bk-title">{event.title}</h1>
      {event.is_featured && <div className="bk-chips"><span className="bk-chip bk-chip-hot">Hot event</span></div>}
      {event.category && <div className="bk-chips"><span className="bk-chip">{event.category}</span></div>}

      <nav className="bk-section-tabs" aria-label="Event details">
        {sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.label}</a>)}
      </nav>

      <div className="bk-detail">
        <div className="bk-detail-content">
          <section className="bk-card bk-detail-section" id="event-about" aria-labelledby="event-about-title">
            <h2 id="event-about-title">About this {event.is_live || event.is_featured ? "event" : "plan"}</h2>
            {event.cover_url && <img className="bk-hero-img" src={event.cover_url} alt={event.title} />}
            {event.summary && <p className="bk-lede" style={{ marginTop: 18 }}>{event.summary}</p>}
            {event.body && <div className="bk-prose">{event.body}</div>}
            {(event.venue_name || event.venue_address) && (
              <div className="bk-event-venue">
                {event.venue_name && <strong>{event.venue_name}</strong>}
                {event.venue_address && <p>{event.venue_address}</p>}
              </div>
            )}
          </section>

          <section className="bk-card bk-detail-section" id="event-itinerary" aria-labelledby="event-itinerary-title">
            <h2 id="event-itinerary-title">Itinerary</h2>
            {event.itineraries.length > 0 ? (
              <div className="bk-itinerary">
                {event.itineraries.map((day) => (
                  <article key={day.id} className="bk-itinerary-day">
                    <h3>{day.title || `Day ${day.day_number}`}</h3>
                    {day.items.length > 0 ? (
                      <ol className="bk-itinerary-list">
                        {day.items.map((item) => <li key={item.id}><span>{item.time_label || "Plan"}</span><p>{item.text}</p></li>)}
                      </ol>
                    ) : <p className="bk-note">The schedule will be shared when this event date is confirmed.</p>}
                  </article>
                ))}
              </div>
            ) : <p className="bk-note">The itinerary will be shared when the next date is announced.</p>}
          </section>

          <section className="bk-card bk-detail-section" id="event-bring" aria-labelledby="event-bring-title">
            <h2 id="event-bring-title">Things to bring</h2>
            {event.things_to_bring.length > 0
              ? <ul className="bk-list">{event.things_to_bring.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
              : <p className="bk-note">We'll share a packing list when the event date is confirmed.</p>}
          </section>

          <section className="bk-card bk-detail-section" id="event-includes" aria-labelledby="event-includes-title">
            <h2 id="event-includes-title">What's included</h2>
            {event.inclusions.length > 0 ? <ul className="bk-list">{event.inclusions.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="bk-note">Inclusions will be confirmed by the event team.</p>}
          </section>

          <section className="bk-card bk-detail-section" id="event-excludes" aria-labelledby="event-excludes-title">
            <h2 id="event-excludes-title">What's not included</h2>
            {event.exclusions.length > 0 ? <ul className="bk-list">{event.exclusions.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="bk-note">Exclusions will be confirmed by the event team.</p>}
          </section>
        </div>

        <EventEnquiryPanel slug={event.slug} eventSlug={event.is_live ? event.slug : undefined} title={event.title} price={event.price} schedules={event.schedules} whatsappNumber={event.booking_whatsapp_number || ""} venue={event.venue_name || event.venue_address} />
      </div>
      <MobileBookBar price={event.price !== null ? money(event.price) : "Ask for price"} label={event.price === null ? "Price" : "From"} />
    </div>
  );
}
