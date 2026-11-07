export function SiteSprite() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <svg className="sprite" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <symbol id="i-arrow" viewBox="0 0 24 24">
          <path d="M4 12h15M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </symbol>
        <symbol id="i-up-right" viewBox="0 0 24 24">
          <path d="M7 17 17 7M8 7h9v9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </symbol>
        <symbol id="i-down" viewBox="0 0 24 24">
          <path d="M12 4v15m-7-7 7 7 7-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </symbol>
        <symbol id="i-pin" viewBox="0 0 24 24">
          <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="10" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </symbol>
        <symbol id="i-menu" viewBox="0 0 24 24">
          <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </symbol>
        <symbol id="i-close" viewBox="0 0 24 24">
          <path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </symbol>
        <symbol id="i-info" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 11v5M12 7.6v.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </symbol>
      </svg>
    </>
  );
}
