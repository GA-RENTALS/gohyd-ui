import { Icon } from "./Icon";
import { SitePhoto } from "./SitePhoto";
import type { PlanCardData } from "./types";

export function PlanCard({ plan }: { plan: PlanCardData }) {
  return (
    <article className="ecard" data-cat={plan.cat}>
      <div className="ph" data-label={plan.label}>
        <SitePhoto photo={plan.photo} />
        <span className="ptag">{plan.tag}</span>
      </div>
      <div className="ebody">
        <span className="ecat">{plan.eyebrow}</span>
        <h3>{plan.title}</h3>
        <p className="blurb">{plan.summary}</p>
        <a className="link" href={plan.href} {...(plan.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {plan.cta} <Icon name="up-right" />
        </a>
      </div>
    </article>
  );
}
