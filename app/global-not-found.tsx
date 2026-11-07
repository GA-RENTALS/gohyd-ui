// Used for unmatched URLs now that the public site and the admin each own their root layout.
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "system-ui, sans-serif", background: "#12130e", color: "#f3eee2" }}>
        <main style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 48, margin: 0 }}>404</h1>
          <p style={{ opacity: 0.8 }}>This page could not be found.</p>
          <a href="/" style={{ color: "inherit" }}>Back to GoHyderabad</a>
        </main>
      </body>
    </html>
  );
}
