import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventBookingPanel } from "@/components/booking/EventBookingPanel";
import { EventEnquiryPanel } from "@/components/booking/EventEnquiryPanel";
import { EventHeroImage } from "@/components/booking/EventHeroImage";
import { MobileBookBar } from "@/components/booking/MobileBookBar";
import { getEvent } from "@/lib/customer/server";
import type { EventDetail, EventSchedule } from "@/lib/customer/types";
import { getPlanBySlug } from "@/components/site/plan-slug";
import { money, time as timeLower } from "@/lib/customer/format";

const time = (iso: string) => timeLower(iso).toUpperCase();
import {
  FEATURED_EVENT_CAPACITY, FEATURED_EVENT_CONTENT, FEATURED_EVENT_ENDS_AT, FEATURED_EVENT_POSTER, FEATURED_EVENT_SLUG,
  FEATURED_EVENT_STARTS_AT, FEATURED_EVENT_WHATSAPP,
} from "@/components/site/data/featured-event";
import "./event-details.css";
import { SITE_NAME, SITE_URL, absoluteUrl, jsonLd, metaDescription, pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

type EventPageData = Omit<EventDetail, "id" | "category_slug"> & { is_live: boolean };

/** Admin bodies are rich text; show them as plain paragraphs (no raw HTML injected into the page). */
function paragraphs(html: string): string[] {
  return html
    .replace(/<\/(p|div|h[1-6]|li)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
    .split(/\n+/).map((line) => line.trim()).filter(Boolean);
}

const factDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

function durationLabel(schedule: EventSchedule): string | null {
  if (!schedule.ends_at || schedule.time_tbd) return null;
  const minutes = Math.round((Date.parse(schedule.ends_at) - Date.parse(schedule.starts_at)) / 60000);
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} Hour${h === 1 ? "" : "s"}` : "", m ? `${m} Min` : ""].filter(Boolean).join(" ");
}

function eveningOrDay(schedule: EventSchedule | undefined) {
  if (!schedule || schedule.time_tbd) return "Plan for the day";
  const hour = Number(new Date(schedule.starts_at).toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }));
  return hour >= 16 ? "Plan for the evening" : "Plan for the day";
}

async function loadPageData(slug: string): Promise<EventPageData | null> {
  const event = await getEvent(slug).catch(() => null);
  if (event) {
    // No poster uploaded yet for the featured event (e.g. seeded without file storage): use the bundled one.
    const cover_url = event.cover_url || (event.slug === FEATURED_EVENT_SLUG ? FEATURED_EVENT_POSTER : null);
    return { ...event, cover_url, is_live: true };
  }

  const plan = getPlanBySlug(slug);
  if (!plan) return null;
  const featured = slug === FEATURED_EVENT_SLUG;
  const content = featured ? FEATURED_EVENT_CONTENT : null;
  return {
    slug,
    title: plan.title,
    summary: plan.summary,
    body: content?.body ?? "",
    category: featured ? "Sports" : plan.eyebrow,
    price: featured ? "499.00" : null,
    cover_url: `/${plan.photo.src.replace(/^\//, "")}`,
    next_date: featured ? FEATURED_EVENT_STARTS_AT : null,
    next_time_tbd: false,
    is_featured: Boolean(plan.is_hot),
    booking_whatsapp_number: featured ? FEATURED_EVENT_WHATSAPP : "",
    venue_name: featured ? "KPHB" : "",
    venue_address: featured ? "KPHB, Hyderabad" : "",
    schedules: featured ? [{ id: "box-cricket-fixed-date", starts_at: FEATURED_EVENT_STARTS_AT, ends_at: FEATURED_EVENT_ENDS_AT, capacity: FEATURED_EVENT_CAPACITY, seats_left: null, is_date_locked: true, time_tbd: false }] : [],
    itineraries: content ? [{ id: 1, day_number: 1, title: "Match day", items: content.timeline.map((item, i) => ({ id: i + 1, ...item })) }] : [],
    things_to_bring: content?.things_to_bring ?? [],
    inclusions: content?.inclusions ?? [],
    exclusions: content?.exclusions ?? [],
    format_details: content?.format_details ?? [],
    rules: content?.rules ?? [],
    highlights: content?.highlights ?? [],
    faqs: content?.faqs ?? [],
    headline: content?.headline ?? "",
    image_caption: content?.image_caption ?? "",
    format_note: content?.format_note ?? "",
    schedule_note: content?.schedule_note ?? "",
    registration_type: "BOTH",
    max_participants_per_booking: null,
    reservation_hold_hours: 24,
    is_live: false,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await loadPageData(slug);
  if (!event) return { title: "Event not found", robots: { index: false } };
  const next = event.schedules[0];
  const when = next ? ` — ${factDate(next.starts_at)}` : "";
  const where = event.venue_address || event.venue_name;
  return pageMetadata({
    title: event.seo_title || `${event.title}${where ? ` in ${where}` : ""}${when}`,
    description: metaDescription(event.seo_description, event.summary, event.body),
    path: `/events/${event.slug}`,
    image: event.cover_url,
    imageAlt: `${event.title} poster`,
    // Old sample plan pages (no live event, not the featured fallback) are thin placeholder content.
    noindex: !event.is_live && !event.is_featured,
  });
}

/** schema.org Event (SportsEvent for sports) per upcoming date, plus breadcrumbs. */
function eventJsonLd(event: EventPageData) {
  const url = `${SITE_URL}/events/${event.slug}`;
  const isSport = /sport|cricket|football|badminton|volley|tennis|run|ride/i.test(`${event.category} ${event.title}`);
  const where = event.venue_address || event.venue_name || "Hyderabad";
  const description = metaDescription(event.summary, event.body);
  const events = event.schedules.slice(0, 5).map((s) => ({
    "@context": "https://schema.org",
    "@type": isSport ? "SportsEvent" : "Event",
    name: event.title,
    description,
    url,
    ...(event.cover_url ? { image: [absoluteUrl(event.cover_url)] } : {}),
    // Date only when the time is not confirmed yet.
    startDate: s.time_tbd ? s.starts_at.slice(0, 10) : s.starts_at,
    ...(s.ends_at && !s.time_tbd ? { endDate: s.ends_at } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue_name || where,
      address: { "@type": "PostalAddress", streetAddress: where, addressLocality: "Hyderabad", addressRegion: "Telangana", addressCountry: "IN" },
    },
    organizer: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL },
    ...(s.capacity ? { maximumAttendeeCapacity: s.capacity } : {}),
    ...(s.seats_left !== null && s.seats_left !== undefined ? { remainingAttendeeCapacity: s.seats_left } : {}),
    ...(event.price !== null ? {
      offers: {
        "@type": "Offer",
        url: `${url}#book`,
        price: Number(event.price).toFixed(2),
        priceCurrency: "INR",
        availability: s.seats_left === 0 ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      },
    } : {}),
  }));
  return [
    ...events,
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Events", item: `${SITE_URL}/#events` },
        { "@type": "ListItem", position: 3, name: event.title, item: url },
      ],
    },
    ...(event.faqs.length ? [{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: event.faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
    }] : []),
  ];
}

function Section({ id, kicker, title, children, className }: { id: string; kicker: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`evd-section-card${className ? ` ${className}` : ""}`} id={id} aria-labelledby={`${id}-title`}>
      <div className="evd-section-kicker">{kicker}</div>
      <h2 id={`${id}-title`}>{title}</h2>
      {children}
    </section>
  );
}

/**
 * Event Details template (from the approved GoHyderabad event page design). One template for every event:
 * cricket, badminton, football, meetups. Sections without content are skipped and the numbering follows.
 */
export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await loadPageData(slug);
  if (!event) notFound();

  const isEvent = event.is_live || event.is_featured;
  const next = event.schedules[0];
  const timeline = event.itineraries.flatMap((day) => day.items.map((item) => ({ ...item, day: day.title, dayNumber: day.day_number })));
  const multiDay = new Set(timeline.map((item) => item.dayNumber)).size > 1;
  const body = paragraphs(event.body || "");
  const isSport = /sport|cricket|football|badminton|volley|tennis/i.test(`${event.category} ${event.title}`);
  const duration = next ? durationLabel(next) : null;
  const venue = event.venue_address || event.venue_name;

  const facts = [
    { label: "Date", value: next ? factDate(next.starts_at) : "To be announced" },
    { label: "Time", value: !next ? "To be announced" : next.time_tbd ? "To be confirmed" : `${time(next.starts_at)}${next.ends_at ? ` – ${time(next.ends_at)}` : ""}` },
    { label: "Duration", value: duration ?? "To be confirmed" },
    { label: "Capacity", value: next?.capacity ? `${next.capacity} Participants` : "Open" },
  ];

  // Build sections in order; only the ones with content are shown, and the kicker numbers follow.
  const blocks: { id: string; kicker: string; title: string; node: React.ReactNode; className?: string }[] = [];
  blocks.push({
    id: "event-about", kicker: isEvent ? "About this event" : "About this plan", title: event.headline || event.title,
    node: (
      <>
        {body.length ? body.map((line, i) => <p key={i}>{line}</p>) : event.summary && <p>{event.summary}</p>}
        {event.highlights.length > 0 && (
          <div className="evd-feature-list">{event.highlights.map((h, i) => <div className="evd-feature" key={`${h}-${i}`}>{h}</div>)}</div>
        )}
      </>
    ),
  });
  if (event.format_details.length) {
    blocks.push({
      id: "event-format", kicker: "Event format", title: isSport ? "How the game works" : "How it works",
      node: (
        <>
          <div className="evd-format-grid">
            {event.format_details.map((d, i) => <div className="evd-format-row" key={`${d.label}-${i}`}><span>{d.label}</span><strong>{d.value}</strong></div>)}
          </div>
          {event.format_note && <p style={{ marginTop: 14 }}>{event.format_note}</p>}
        </>
      ),
    });
  }
  blocks.push({
    id: "event-schedule", kicker: "Event schedule", title: eveningOrDay(next),
    node: (
      <>
        {timeline.length > 0 ? (
          <ul className="evd-schedule">
            {timeline.map((item) => (
              <li key={item.id}>
                <time>{multiDay ? `${item.day || `Day ${item.dayNumber}`} · ` : ""}{item.time_label || "—"}</time>
                <div><strong>{item.text}</strong>{item.detail && <small>{item.detail}</small>}</div>
              </li>
            ))}
          </ul>
        ) : event.schedules.length > 0 ? (
          <ul className="evd-schedule">
            {event.schedules.map((s) => (
              <li key={s.id}>
                <time>{factDate(s.starts_at)}</time>
                <div><strong>{s.time_tbd ? "Time to be confirmed" : `${time(s.starts_at)}${s.ends_at ? ` – ${time(s.ends_at)}` : ""}`}</strong>{durationLabel(s) && <small>{durationLabel(s)}</small>}</div>
              </li>
            ))}
          </ul>
        ) : <p>The next date will be announced soon.</p>}
        {event.schedule_note && <p style={{ marginTop: 14, fontSize: 12 }}>{event.schedule_note}</p>}
      </>
    ),
  });
  if (event.things_to_bring.length) blocks.push({ id: "event-bring", kicker: "Things to bring", title: "Come prepared", node: <ul className="evd-bring-list">{event.things_to_bring.map((t, i) => <li key={i}>{t}</li>)}</ul> });
  if (event.inclusions.length) blocks.push({ id: "event-includes", kicker: "What's included", title: "Your registration includes", node: <ul className="evd-plain-list">{event.inclusions.map((t, i) => <li key={i}>{t}</li>)}</ul> });
  if (event.exclusions.length) blocks.push({ id: "event-excludes", kicker: "What's not included", title: "Additional expenses", node: <ul className="evd-plain-list">{event.exclusions.map((t, i) => <li key={i}>{t}</li>)}</ul> });
  if (event.rules.length) blocks.push({ id: "event-rules", kicker: "Rules & guidelines", title: "Let's keep it fun and fair", node: <ul className="evd-plain-list">{event.rules.map((t, i) => <li key={i}>{t}</li>)}</ul> });
  if (event.faqs.length) {
    blocks.push({
      id: "event-faq", kicker: "Frequently asked questions", title: "Good to know", className: "evd-faq",
      node: event.faqs.map((f, i) => <details key={i}><summary>{f.question}</summary><p>{f.answer}</p></details>),
    });
  }

  return (
    <div className="evd">
      {(event.is_live || event.is_featured) && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(eventJsonLd(event)) }} />}
      <div className="evd-container">
        <section className="evd-hero">
          <div className="evd-eyebrow">{isEvent ? "Community event" : "Plan"}</div>
          <h1>{event.title}</h1>
          <div className="evd-pills">
            {event.is_featured && <span className="evd-pill hot">HOT EVENT</span>}
            {event.category && <span className="evd-pill">{event.category}</span>}
            {venue && <span className="evd-pill">{venue}</span>}
          </div>
        </section>

        <div className="evd-hero-grid">
          <div className="evd-main-column" id="event-details">
            {event.cover_url && <EventHeroImage src={event.cover_url} alt={`${event.title} cover`} />}
            {event.image_caption && <div className="evd-image-caption">{event.image_caption}</div>}

            <div className="evd-quick-facts" aria-label="Event information">
              {facts.map((f) => (
                <div className="evd-fact" key={f.label}><div className="evd-fact-label">{f.label}</div><div className="evd-fact-value">{f.value}</div></div>
              ))}
            </div>

            {blocks.map((b, i) => (
              <Section key={b.id} id={b.id} kicker={`${String(i + 1).padStart(2, "0")} / ${b.kicker}`} title={b.title} className={b.className}>
                {b.node}
              </Section>
            ))}
          </div>

          {event.is_live ? (
            <EventBookingPanel
              slug={event.slug}
              title={event.title}
              price={event.price}
              schedules={event.schedules}
              whatsappNumber={event.booking_whatsapp_number || ""}
              venue={venue}
              registrationType={event.registration_type}
              maxPerBooking={event.max_participants_per_booking}
              holdHours={event.reservation_hold_hours}
            />
          ) : (
            <EventEnquiryPanel slug={event.slug} title={event.title} price={event.price} schedules={event.schedules} whatsappNumber={event.booking_whatsapp_number || ""} venue={venue} />
          )}
        </div>
      </div>
      <MobileBookBar
        price={event.price !== null ? money(event.price) : "Ask for price"}
        label={event.price === null ? "Price" : "Entry fee"}
        suffix={event.price !== null ? "/ person" : undefined}
        cta="Reserve your spot"
      />
    </div>
  );
}
