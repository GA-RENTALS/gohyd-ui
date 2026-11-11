import type { PlanCardData } from "../types";

/**
 * Local fallback for the Box Cricket event, used only while the backend has no Event with this slug
 * (or the API is unreachable). Once the Event is published in the admin panel, the API version wins.
 */
export const FEATURED_EVENT_SLUG = "box-cricket-community-play-day";
export const FEATURED_EVENT_STARTS_AT = "2026-11-14T19:00:00+05:30";
export const FEATURED_EVENT_ENDS_AT = "2026-11-14T22:00:00+05:30";
export const FEATURED_EVENT_CAPACITY = 15;
export const FEATURED_EVENT_WHATSAPP = "+91 90593 38727";
export const FEATURED_EVENT_POSTER = "/assets/img/box-cricket-poster.jpg";

export const FEATURED_EVENT_PLAN: PlanCardData = {
  slug: FEATURED_EVENT_SLUG,
  is_hot: true,
  cat: "sports",
  label: "Box Cricket Community Play Day",
  photo: {
    src: FEATURED_EVENT_POSTER,
    alt: "Box Cricket Community Play Day poster: Sat 14 Nov, KPHB Hyderabad, entry fee ₹499, only 15 slots",
    width: 1122,
    height: 1402,
  },
  tag: "Sports",
  eyebrow: "Sports · KPHB, Hyderabad",
  title: "Box Cricket Community Play Day",
  summary: "Three pool-play matches, 10 overs per match, and three hours of cricket and new friends. Sat, 14 Nov, 7–10 PM · ₹499 · 15 slots.",
  cta: "Book your spot",
};

/** True while the fallback event date (Hyderabad calendar day) has not passed. */
export function isFeaturedFallbackUpcoming(now = new Date()): boolean {
  const endOfDay = Date.parse(FEATURED_EVENT_STARTS_AT) + 24 * 60 * 60 * 1000;
  return now.getTime() < endOfDay;
}

/** Section content for the fallback page; mirrors `seed_box_cricket_event` in the API. */
export const FEATURED_EVENT_CONTENT = {
  headline: "Play. Connect. Make New Friends.",
  image_caption: "A community evening of cricket, friendly competition and new connections.",
  body: "<p>Looking for something fun to do, new people to meet and a little friendly competition? Join us for the Box Cricket Community Play Day — an evening designed for sports lovers and people who enjoy meeting new faces.</p><p>Come alone or bring your friends. Our organisers will manage team formation so everyone can participate, enjoy the game and connect with the GoHyderabad community.</p>",
  highlights: ["Meet people from the community", "Organiser-managed teams", "Friendly match environment", "Three pool-play matches"],
  format_details: [
    { label: "Game", value: "Box Cricket" },
    { label: "Match format", value: "Pool Play" },
    { label: "Number of matches", value: "3" },
    { label: "Overs per match", value: "10" },
    { label: "Team formation", value: "Organiser-managed" },
    { label: "Registration", value: "Individual & Group" },
  ],
  format_note: "Participants can register individually or with friends. Teams will be formed by the event organisers. Match rules will be explained before play begins.",
  timeline: [
    { time_label: "7:00 PM", text: "Arrival & check-in", detail: "Meet the event team and complete check-in." },
    { time_label: "After check-in", text: "Team formation & briefing", detail: "Meet your teammates and understand the match format." },
    { time_label: "Match 1", text: "First pool-play match", detail: "10-over match." },
    { time_label: "Match 2", text: "Second pool-play match", detail: "10-over match." },
    { time_label: "Match 3", text: "Third pool-play match", detail: "10-over match." },
    { time_label: "10:00 PM", text: "Event concludes", detail: "Wrap up and connect with fellow participants." },
  ],
  schedule_note: "Match sequence and timings may be adjusted by the organiser depending on attendance and ground conditions.",
  things_to_bring: ["Comfortable sportswear.", "Sports shoes suitable for the turf.", "Personal water bottle.", "Towel and personal essentials.", "A positive attitude and sports spirit!"],
  inclusions: ["Box cricket turf access.", "Drinking water.", "Organiser-managed team formation.", "Participation in the scheduled pool-play matches."],
  exclusions: ["Transportation to and from the venue.", "Food and refreshments.", "Personal expenses.", "Any service not specifically listed under inclusions."],
  rules: [
    "Arrive on time for check-in and team formation.",
    "Follow the instructions of the event organiser.",
    "Respect teammates, opponents and venue staff.",
    "Maintain fair play and good sportsmanship.",
    "Follow the venue's safety guidelines.",
    "Final match rules will be communicated before the event.",
  ],
  faqs: [
    { question: "Can I register alone?", answer: "Yes. Individual registrations are welcome. The event organiser will manage team formation." },
    { question: "Can I register with friends?", answer: "Yes. You can submit a group request, subject to the remaining event capacity." },
    { question: "Do I need to arrange my own team?", answer: "No. Teams will be formed by the event organiser." },
    { question: "When is my booking confirmed?", answer: "Your request is not confirmed until the GoHyderabad team verifies availability and sends a confirmation." },
    { question: "What if the event is full?", answer: "You may contact the event team to check whether a waiting list is available." },
  ],
};
