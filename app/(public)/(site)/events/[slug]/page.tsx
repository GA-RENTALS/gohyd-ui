import { serverT } from "@/lib/lang-server";
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

/**
 * Event detail page. Same layout and styles as the trip page (booking.css): title, chips, red section tabs,
 * content cards on the left and the booking card on the right. Sections without content are skipped.
 */
export default async function EventPage({ params }: Props) {
  const t = await serverT();
  const { slug } = await params;
  const event = await loadPageData(slug);
  if (!event) notFound();

  const isEvent = event.is_live || event.is_featured;
  const next = event.schedules[0];
  const body = paragraphs(event.body || "");
  const isSport = /sport|cricket|football|badminton|volley|tennis/i.test(`${event.category} ${event.title}`);
  const venue = event.venue_address || event.venue_name;
  const duration = next ? durationLabel(next) : null;

  const facts = [
    next ? factDate(next.starts_at) : null,
    next && !next.time_tbd ? `${time(next.starts_at)}${next.ends_at ? ` – ${time(next.ends_at)}` : ""}` : null,
    duration ? duration.toLowerCase() : null,
    next?.capacity ? `${next.capacity} participants` : null,
  ].filter(Boolean) as string[];

  const list = (items: string[]) => <ul className="bk-list">{items.map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}</ul>;

  const sections: { id: string; label: string; title: string; node: React.ReactNode }[] = [];
  sections.push({
    id: "event-about", label: t("tab.about"), title: isEvent ? t("About this event") : t("About this plan"),
    node: (
      <>
        {event.cover_url && <EventHeroImage src={event.cover_url} alt={`${event.title} poster`} />}
        {event.image_caption && <p className="bk-hint" style={{ marginTop: 8 }}>{event.image_caption}</p>}
        {event.summary && <p className="bk-lede" style={{ marginTop: 18 }}>{event.summary}</p>}
        {facts.length > 0 && <p className="bk-note">{facts.join(" · ")}</p>}
        {event.headline && <h3 style={{ margin: "18px 0 8px" }}>{event.headline}</h3>}
        {body.map((line, i) => <p key={i} className="bk-prose">{line}</p>)}
        {event.highlights.length > 0 && list(event.highlights)}
        {venue && (
          <div className="bk-event-venue">
            {event.venue_name && <strong>{event.venue_name}</strong>}
            {event.venue_address && event.venue_address !== event.venue_name && <p>{event.venue_address}</p>}
          </div>
        )}
      </>
    ),
  });
  if (event.format_details.length) {
    sections.push({
      id: "event-format", label: t("Format"), title: isSport ? t("Game format") : t("Format"),
      node: (
        <>
          <dl className="bk-format-grid">
            {event.format_details.map((d, i) => <div key={`${d.label}-${i}`}><dt>{d.label}</dt><dd>{d.value}</dd></div>)}
          </dl>
          {event.format_note && <p className="bk-note" style={{ marginTop: 14 }}>{event.format_note}</p>}
        </>
      ),
    });
  }
  sections.push({
    id: "event-itinerary", label: t("Itinerary"), title: t("Itinerary"),
    node: (
      <>
        {event.itineraries.length > 0 ? (
          <div className="bk-itinerary">
            {event.itineraries.map((day) => (
              <article key={day.id} className="bk-itinerary-day">
                <h3>{day.title || `Day ${day.day_number}`}</h3>
                {day.items.length > 0 ? (
                  <ol className="bk-itinerary-list">
                    {day.items.map((item) => <li key={item.id}><span>{item.time_label || t("Plan")}</span><p>{item.text}{item.detail && <><br /><small className="bk-hint">{item.detail}</small></>}</p></li>)}
                  </ol>
                ) : <p className="bk-note">{t("The schedule will be shared when this event date is confirmed.")}</p>}
              </article>
            ))}
          </div>
        ) : event.schedules.length > 0 ? (
          <ul className="bk-schedule-list">
            {event.schedules.map((s) => (
              <li key={s.id}><strong>{factDate(s.starts_at)}</strong><span>{s.time_tbd ? t("Time to be confirmed") : `${time(s.starts_at)}${s.ends_at ? ` – ${time(s.ends_at)}` : ""}`}</span></li>
            ))}
          </ul>
        ) : <p className="bk-note">{t("The itinerary will be shared when the next date is announced.")}</p>}
        {event.schedule_note && <p className="bk-hint" style={{ marginTop: 14 }}>{event.schedule_note}</p>}
      </>
    ),
  });
  if (event.things_to_bring.length) sections.push({ id: "event-bring", label: t("Things to bring"), title: t("Things to bring"), node: list(event.things_to_bring) });
  if (event.inclusions.length) sections.push({ id: "event-includes", label: t("Includes"), title: t("What's included"), node: list(event.inclusions) });
  if (event.exclusions.length) sections.push({ id: "event-excludes", label: t("Excludes"), title: t("What's not included"), node: list(event.exclusions) });
  if (event.rules.length) sections.push({ id: "event-rules", label: t("Rules"), title: t("Rules"), node: <ul className="bk-list bk-rules">{event.rules.map((t, i) => <li key={i}>{t}</li>)}</ul> });
  if (event.faqs.length) {
    sections.push({
      id: "event-faq", label: t("FAQs"), title: t("FAQs"),
      node: event.faqs.map((f, i) => <details key={i} className="bk-more"><summary>{f.question}</summary><p className="bk-note" style={{ margin: "0 0 8px" }}>{f.answer}</p></details>),
    });
  }

  return (
    <div className="wrap">
      {isEvent && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(eventJsonLd(event)) }} />}
      <div className="eyebrow">{isEvent ? t("Event") : t("Plan")}</div>
      <h1 className="bk-title">{event.title}</h1>
      <div className="bk-chips">
        {event.is_featured && <span className="bk-chip bk-chip-hot">{t("Hot event")}</span>}
        {event.category && <span className="bk-chip">{event.category}</span>}
        {venue && <span className="bk-chip">{venue}</span>}
      </div>

      <nav className="bk-section-tabs" aria-label="Event details">
        {sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.label}</a>)}
      </nav>

      <div className="bk-detail">
        <div className="bk-detail-content">
          {sections.map((section) => (
            <section key={section.id} className="bk-card bk-detail-section" id={section.id} aria-labelledby={`${section.id}-title`}>
              <h2 id={`${section.id}-title`}>{section.title}</h2>
              {section.node}
            </section>
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
      <MobileBookBar
        price={event.price !== null ? money(event.price) : t("Ask for price")}
        label={event.price === null ? t("Price") : t("Entry fee")}
        suffix={event.price !== null ? t("/ person") : undefined}
        cta={t("Reserve your spot")}
      />
    </div>
  );
}
