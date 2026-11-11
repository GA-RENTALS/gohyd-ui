"use client";
import { useEffect, useRef, useState } from "react";

/** Landscape photos fill the frame; portrait posters are shown whole instead of being cropped. */
export function EventHeroImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [portrait, setPortrait] = useState(false);
  const check = (img: HTMLImageElement | null) => {
    if (img && img.naturalWidth) setPortrait(img.naturalHeight > img.naturalWidth * 1.05);
  };
  useEffect(() => { if (ref.current?.complete) check(ref.current); }, [src]);
  return (
    <img
      ref={ref}
      className={`bk-hero-img${portrait ? " bk-hero-poster" : ""}`}
      src={src}
      alt={alt}
      onLoad={(e) => check(e.currentTarget)}
    />
  );
}
