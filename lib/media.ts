/**
 * Photos uploaded in the admin (S3) are full size. Route them through Next's image resizer so each slot downloads
 * only the width it needs, as WebP/AVIF, with long caching. If the resizer ever fails, fall back to the original file.
 * Widths must be ones Next allows (its default deviceSizes / imageSizes).
 */
const WIDTHS = [384, 640, 828, 1200] as const;

/** Only uploaded (absolute http/https) images are resized; the site's own photos are already small WebP files. */
export const isRemote = (url: string) => /^https?:\/\//.test(url);

export function resized(url: string, width: (typeof WIDTHS)[number] = 828, quality = 70): string {
  if (!isRemote(url)) return url;
  return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=${quality}`;
}

export function resizedSrcSet(url: string, widths: readonly (typeof WIDTHS)[number][] = WIDTHS): string {
  return widths.map((w) => `${resized(url, w)} ${w}w`).join(", ");
}

/** Point an <img> at the resized versions; if loading them fails, use the original upload instead. */
export function applyResized(img: HTMLImageElement, url: string, sizes: string, widths?: readonly (typeof WIDTHS)[number][]) {
  if (!isRemote(url)) { img.src = url; return; }
  img.src = resized(url);
  img.srcset = resizedSrcSet(url, widths);
  img.sizes = sizes;
  img.addEventListener("error", function fallback() {
    img.removeEventListener("error", fallback);
    img.removeAttribute("srcset");
    img.src = url;
  });
}
