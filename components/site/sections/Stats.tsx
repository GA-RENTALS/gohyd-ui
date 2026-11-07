
export function Stats() {
  return (
    <section className="stats" aria-label="GoHyderabad in numbers">
      <div className="wrap stats-grid">
        <div className="stat" data-reveal="">
          <b className="num" data-count="12500" data-suffix="+">12,500+</b>
          <span>Community members</span>
        </div>
        <div className="stat" data-reveal="" data-d="1">
          <b className="num" data-count="480" data-suffix="+">480+</b>
          <span>Weekend experiences hosted</span>
        </div>
        <div className="stat" data-reveal="" data-d="2">
          <b className="num" data-count="36" data-suffix="">36</b>
          <span>Hidden spots explored</span>
        </div>
        <div className="stat" data-reveal="" data-d="3">
          <b className="num" data-count="4.8" data-decimals="1" data-suffix="/5">4.8/5</b>
          <span>Average experience rating</span>
        </div>
      </div>
    </section>
  );
}
