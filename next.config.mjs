/** @type {import('next').NextConfig} */
const nextConfig = {
  // The page script attaches listeners and builds the Leaflet map once; keep dev from running it twice.
  // Lets a verification build run beside `next dev` without sharing (and corrupting) the .next folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: false,
  // The public site and /admin are separate root layouts, so unmatched URLs need a global 404.
  experimental: { globalNotFound: true },
  async headers() {
    return [{ source: "/assets/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }];
  },
};

export default nextConfig;
