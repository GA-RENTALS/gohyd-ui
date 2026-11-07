import type { Booking } from "@/lib/customer/types";

/** Which tab a booking belongs to. */
export type Bucket = "upcoming" | "past" | "cancelled";
export type Tone = "good" | "wait" | "bad" | "done";

const CANCELLED = new Set(["CANCELLED"]);
const FINISHED = new Set(["COMPLETED", "NO_SHOW"]);

export function bucketOf(b: Booking, now = Date.now()): Bucket {
  if (CANCELLED.has(b.status)) return "cancelled";
  if (FINISHED.has(b.status) || new Date(b.starts_at).getTime() < now) return "past";
  return "upcoming";
}

/** Words and colour for the status pill, in plain language. */
export function statusInfo(b: Booking): { label: string; tone: Tone } {
  switch (b.status) {
    case "PENDING_ADVANCE": return { label: "Awaiting payment", tone: "wait" };
    case "CONFIRMED": return { label: "Confirmed", tone: "good" };
    case "FULLY_PAID": return { label: "Fully paid", tone: "good" };
    case "COMPLETED": return { label: "Completed", tone: "done" };
    case "NO_SHOW": return { label: "Missed", tone: "bad" };
    case "CANCELLED": return { label: "Cancelled", tone: "bad" };
    default: return { label: b.status.charAt(0) + b.status.slice(1).toLowerCase().replace(/_/g, " "), tone: "wait" };
  }
}

export type StepState = "done" | "current" | "todo";
export type Step = { title: string; date: string; state: StepState };

/** Four steps from booking to trip day. */
export function timeline(b: Booking, fmt: (iso: string) => string, now = Date.now()): Step[] {
  const paid = Number(b.paid) > 0;
  const fullyPaid = Number(b.outstanding) <= 0 && paid;
  const tripPast = new Date(b.starts_at).getTime() < now || FINISHED.has(b.status);
  return [
    { title: "Booking placed", date: fmt(b.created_at), state: "done" },
    { title: "Advance paid", date: paid ? "Received" : "Waiting", state: paid ? "done" : "current" },
    { title: "Balance paid", date: fullyPaid ? "Received" : `Due ${fmt(b.balance_due_at)}`, state: fullyPaid ? "done" : paid ? "current" : "todo" },
    { title: "Trip day", date: fmt(b.starts_at), state: tripPast ? "done" : fullyPaid ? "current" : "todo" },
  ];
}

export const needsPayment = (b: Booking) => bucketOf(b) !== "cancelled" && Number(b.outstanding) > 0;
