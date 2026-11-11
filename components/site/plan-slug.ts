import { PLANS } from "./data/plans";
import type { PlanCardData } from "./types";

export function planSlug(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getPlanBySlug(slug: string): PlanCardData | undefined {
  return PLANS.find((plan) => (plan.slug || planSlug(plan.title)) === slug);
}
