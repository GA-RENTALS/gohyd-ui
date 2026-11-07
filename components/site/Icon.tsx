export type IconName = "arrow" | "up-right" | "down" | "pin" | "menu" | "close" | "info";

/** An icon from the shared SVG sprite (see SiteSprite). The size and colour come from the surrounding CSS. */
export function Icon({ name }: { name: IconName }) {
  return (
    <svg aria-hidden="true">
      <use href={`#i-${name}`} />
    </svg>
  );
}
