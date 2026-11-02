/** @type {import('next').NextConfig} */
const nextConfig = {
  // The page script attaches listeners and builds the Leaflet map once; keep dev from running it twice.
  reactStrictMode: false,
};

export default nextConfig;
