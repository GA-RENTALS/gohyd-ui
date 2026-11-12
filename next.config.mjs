const backend = new URL(process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000");
const mediaHost = process.env.NEXT_PUBLIC_MEDIA_HOST;   // optional CloudFront / custom media domain

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Metadata (description, canonical, Open Graph) goes in <head> for every visitor, not streamed later:
  // Lighthouse, link previews and smaller crawlers only read the <head>.
  htmlLimitedBots: /.*/,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: backend.protocol.replace(":", ""), hostname: backend.hostname, ...(backend.port ? { port: backend.port } : {}), pathname: "/media/**" },
      ...(mediaHost ? [{ protocol: "https", hostname: mediaHost }] : []),
    ],
  },
  output: "standalone",
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: false,
  experimental: { globalNotFound: true },
  async headers() {
    return [
      { source: "/assets/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      {
        // Safe security headers for every page. COOP allows popups so the Razorpay checkout window keeps working.
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
};

export default nextConfig;
