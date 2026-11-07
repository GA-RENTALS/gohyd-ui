import { SitePhoto } from "./SitePhoto";
import type { MapPlaceData } from "./types";

/** One row of the map list. The data-* attributes are read by the map script (initPage) to place the pins. */
export function MapPlaceItem({ place }: { place: MapPlaceData }) {
  return (
    <li>
      <a
        className="mitem"
        href={place.mapsHref}
        target="_blank"
        rel="noopener noreferrer"
        data-lat={place.lat}
        data-lng={place.lng}
        data-name={place.name}
        data-area={place.area}
        data-slug={place.slug}
        data-group={place.group}
        data-text={place.text}
      >
        <span className="mthumb ph" data-label={place.label}>
          <SitePhoto photo={place.photo} />
        </span>
        <span>
          <b>{place.name}</b>
          <small>{place.subtitle}</small>
        </span>
      </a>
    </li>
  );
}
