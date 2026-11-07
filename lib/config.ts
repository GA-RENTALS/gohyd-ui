/**
 * The one place that knows where the Django backend lives.
 * Set NEXT_PUBLIC_BACKEND_URL (for example https://api.gohyderabad.com). Use 127.0.0.1, not "localhost", in development:
 * Django's dev server listens on IPv4 only, while browsers may try IPv6 (::1) first.
 */
export const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
export const API_URL = `${BACKEND_URL}/api/v1`;
