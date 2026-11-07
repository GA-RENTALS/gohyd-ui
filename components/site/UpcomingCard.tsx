import { Icon } from "./Icon";
import { SitePhoto } from "./SitePhoto";
import type { UpcomingCardData } from "./types";

export function UpcomingCard({ card }: { card: UpcomingCardData }) {
  return (
    <article className="ecard up-card">
      <div className="ph" data-label={card.label}>
        <SitePhoto photo={card.photo} />
        <span className="ptag">{card.tag}</span>
        <span className="badge">{card.badge}</span>
      </div>
      <div className="ebody">
        <span className="ecat">{card.eyebrow}</span>
        <h3>{card.title}</h3>
        <p className="blurb">{card.summary}</p>
        <dl className="edl">
          <dt>Date</dt>
          <dd>{card.date}</dd>
          <dt>Price</dt>
          <dd>{card.price}</dd>
          <dt>Status</dt>
          <dd>{card.status}</dd>
        </dl>
        <a className="link" href={card.href}>
          {card.cta} <Icon name="up-right" />
        </a>
      </div>
    </article>
  );
}
