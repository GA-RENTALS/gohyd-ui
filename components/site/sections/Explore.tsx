import { serverT } from "@/lib/lang-server";
import { MapPlaceItem } from "../MapPlaceItem";
import { MAP_PLACES } from "../data/map-places";

export async function Explore() {
  const t = await serverT();
  return (
    <section className="explore pad" id="explore" aria-labelledby="map-title">
      <div className="wrap">
        <h3 className="map-title" id="map-title" data-reveal="">{t("Find them on the map")}</h3>
        <p className="map-sub" data-reveal="">
          {t("53 escapes and city favourites, pinned. Tap a pin or a name to see where it sits in the city.")}
        </p>
        <div className="map-grid" data-reveal="">
          <ol className="map-list" id="map-list" aria-label="Places on the map">
            {MAP_PLACES.map((place) => <MapPlaceItem key={`${place.name}-${place.lat},${place.lng}`} place={place} />)}
          </ol>
          <div className="map-box">
            <div id="map" role="region" aria-labelledby="map-title" />
            <button className="map-fit" id="map-fit" type="button">{t("Show all")}</button>
          </div>
        </div>
        <p className="map-note">
          {t("Pin positions are approximate. Map tiles © Esri, HERE, Garmin, OpenStreetMap contributors.")}
        </p>
      </div>
    </section>
  );
}
