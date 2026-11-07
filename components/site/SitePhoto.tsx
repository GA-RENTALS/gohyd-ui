import type { Photo } from "./types";

/** A lazy-loaded responsive image. Every photo on the page uses the same loading behaviour. */
export function SitePhoto({ photo }: { photo: Photo }) {
  return (
    <img
      src={photo.src}
      srcSet={photo.srcSet}
      sizes={photo.sizes}
      width={photo.width}
      height={photo.height}
      alt={photo.alt}
      loading="lazy"
      decoding="async"
    />
  );
}
