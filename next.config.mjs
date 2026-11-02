/** @type {import('next').NextConfig} */
const nextConfig = {
  // The page script attaches listeners and builds the Leaflet map once; keep dev from running it twice.
  reactStrictMode: false,
  async headers() {
    return [{ source: "/assets/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }];
  },
};

export default nextConfig;
