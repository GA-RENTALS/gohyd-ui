import { Icon } from "./Icon";
import { SitePhoto } from "./SitePhoto";
import { planSlug } from "./plan-slug";
import type { PlanCardData } from "./types";

export function PlanCard({ plan }: { plan: PlanCardData }) {
  const slug = plan.slug || planSlug(plan.title);
  return (
    <article className="ecard" data-cat={plan.cat}>
      <div className="ph" data-label={plan.label}>
        <SitePhoto photo={plan.photo} />
        <span className="ptag">{plan.tag}</span>
        {plan.is_hot && <span className="badge hot-event-badge">Hot event</span>}
      </div>
      <div className="ebody">
        <span className="ecat">{plan.eyebrow}</span>
        <h3>{plan.title}</h3>
        <p className="blurb">{plan.summary}</p>
        <a className="link" href={`/events/${slug}`}>
          {plan.cta} <Icon name="up-right" />
        </a>
      </div>
    </article>
  );
}
