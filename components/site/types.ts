/** Shapes of the content shown on the public home page. Keeping them here means the data files stay plain and typed. */

export type Photo = {
  src: string;
  alt: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
};

/** A trip plan card in the "Events" grid. */
export type PlanCardData = {
  slug?: string;
  is_hot?: boolean;
  /** Category slug used by the filter chips (e.g. "trekking"). */
  cat: string;
  label: string;
  photo: Photo;
  tag: string;
  eyebrow: string;
  title: string;
  summary: string;
  cta: string;
};

/** A sample card in the "Upcoming" rail. */
export type UpcomingCardData = {
  label: string;
  photo: Photo;
  tag: string;
  badge: string;
  eyebrow: string;
  title: string;
  summary: string;
  date: string;
  price: string;
  status: string;
  href: string;
  cta: string;
};

/** One pin in the "Explore Hyderabad" map list. */
export type MapPlaceData = {
  name: string;
  area: string;
  slug: string;
  /** "old" = Old City, "esc" = escape further out, "" = the rest of the city. */
  group: string;
  lat: string;
  lng: string;
  text: string;
  mapsHref: string;
  label: string;
  /** The line shown under the name (often "Category · Region"). */
  subtitle: string;
  photo: Photo;
};

/** One line of the photo-credits list in the footer. */
export type CreditData = {
  file: string;
  fileUrl: string;
  author: string;
  licence: string;
  licenceUrl: string;
  /** Trailing sentence, e.g. ". Resized for web." */
  note: string;
};
