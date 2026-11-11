/**
 * Homepage numbers. Edited in Admin → Settings → Business settings → `homepage.stats`.
 * Hidden until publicContent.ts loads them from /api/v1/site-settings/ (and stays hidden when the list is empty).
 */
export function Stats() {
  return (
    <section className="stats" id="stats" aria-label="GoHyderabad in numbers" hidden>
      <div className="wrap stats-grid" id="stats-grid" />
    </section>
  );
}
