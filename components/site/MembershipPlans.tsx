import type { MembershipPlan } from "@/lib/customer/public-content";

const rupees = (value: string) => `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

/** "1 year", "6 months", "45 days" for a plan's length. */
function period(days: number) {
  if (days % 365 === 0) return days === 365 ? "1 year" : `${days / 365} years`;
  if (days % 30 === 0) return days === 30 ? "1 month" : `${days / 30} months`;
  return `${days} days`;
}

/** Membership plans as cards. The enquiry form next to them is how people join for now. */
export function MembershipPlans({ plans }: { plans: MembershipPlan[] }) {
  return (
    <div className="bk-card">
      <h2>Membership plans</h2>
      <div className="bk-plan-grid">
        {plans.map((plan) => (
          <article key={plan.id} className="bk-plan">
            <h3>{plan.name}</h3>
            <p className="bk-plan-price">{rupees(plan.price)} <span>/ {period(plan.duration_days)}</span></p>
            {plan.discount_percent > 0 && <p className="bk-plan-save">{plan.discount_percent}% off trips and events</p>}
            {plan.benefits.length > 0 && <ul className="bk-list">{plan.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>}
          </article>
        ))}
      </div>
      <p className="bk-hint">To join, send the form with the plan you want. The team will confirm and share payment details.</p>
    </div>
  );
}
