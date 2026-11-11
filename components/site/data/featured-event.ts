import type { PlanCardData } from "../types";

export const FEATURED_EVENT_SLUG = "box-cricket-community-play-day";
export const FEATURED_EVENT_STARTS_AT = "2026-11-14T00:00:00+05:30";
export const FEATURED_EVENT_WHATSAPP = "+91 90593 38727";

export const FEATURED_EVENT_PLAN: PlanCardData = {
  slug: FEATURED_EVENT_SLUG,
  is_hot: true,
  cat: "sports",
  label: "Box Cricket Community Play Day",
  photo: {
    src: "assets/img/cricket-morning-1200.jpg",
    alt: "A cricket ground in the morning",
    srcSet: "assets/img/cricket-morning-640.jpg 640w, assets/img/cricket-morning-1200.jpg 1200w",
    sizes: "(min-width:700px) 340px, 82vw",
  },
  tag: "Hot event",
  eyebrow: "Sports · KPHB, Hyderabad",
  title: "Box Cricket Community Play Day",
  summary: "Three pool-play matches, 10 overs per match, and three hours of cricket and new friends. Sat, 14 Nov · ₹499 · 15 slots.",
  cta: "Book your spot",
};
