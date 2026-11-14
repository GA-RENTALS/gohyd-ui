/** Wording for an event's cancellation and refund policy, shared by the event page and the account page. */
import type { EventRefundTier } from "./types";

/** 48 → "2 days", 36 → "36 hours", 1 → "1 hour". */
export function hoursLabel(hours: number) {
  if (hours >= 48 && hours % 24 === 0) return `${hours / 24} days`;
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

/** One line per tier, most generous first, e.g. "100% back if you cancel 2 days or more before the start". */
export function refundTierLines(tiers: EventRefundTier[]) {
  return [...tiers]
    .sort((a, b) => b.hours_before - a.hours_before)
    .map((t) => `${t.refund_percent}% back if you cancel ${t.hours_before ? `${hoursLabel(t.hours_before)} or more before the start` : "any time before the start"}${t.note ? ` (${t.note})` : ""}`);
}

export function cutoffLine(cutoffHours: number) {
  return cutoffHours > 0
    ? `You can cancel online from your account until ${hoursLabel(cutoffHours)} before the start.`
    : "You can cancel online from your account until the event starts.";
}
