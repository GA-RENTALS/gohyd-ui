"use client";

/**
 * One small API client shared by the admin panel and the customer site.
 * Each caller gets its own base URL and its own token storage key, so a staff session and a customer session never mix.
 */

export type Tokens = { access: string; refresh: string };

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}

/** Turn whatever the server sent back into one readable sentence. */
export function messageFrom(body: any, fallback: string): string {
  if (!body) return fallback;
  if (typeof body === "string") return body;
  if (body.detail) return String(body.detail);
  if (body.message) return String(body.message);
  const first = Object.entries(body)[0];
  if (first) return `${first[0]}: ${Array.isArray(first[1]) ? first[1][0] : first[1]}`;
  return fallback;
}

export type RequestOptions = RequestInit & { auth?: boolean; json?: unknown };

export function createApiClient({ baseUrl, storageKey }: { baseUrl: string; storageKey: string }) {
  const tokenStore = {
    get(): Tokens | null {
      try { return JSON.parse(localStorage.getItem(storageKey) || "null"); } catch { return null; }
    },
    set(t: Tokens) { try { localStorage.setItem(storageKey, JSON.stringify(t)); } catch {} },
    clear() { try { localStorage.removeItem(storageKey); } catch {} },
  };

  let refreshing: Promise<boolean> | null = null;
  async function refresh(): Promise<boolean> {
    const t = tokenStore.get();
    if (!t) return false;
    refreshing ||= fetch(`${baseUrl}/auth/refresh/`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh: t.refresh }),
    }).then(async (r) => {
      if (!r.ok) return false;
      const d = await r.json();
      tokenStore.set({ access: d.access, refresh: d.refresh || t.refresh });
      return true;
    }).catch(() => false).finally(() => { refreshing = null; });
    return refreshing;
  }

  async function api<T = any>(path: string, init: RequestOptions = {}, retry = true): Promise<T> {
    const { auth = true, json, headers, ...rest } = init;
    const h = new Headers(headers);
    const isForm = typeof FormData !== "undefined" && json instanceof FormData;   // file uploads: the browser sets the multipart boundary
    if (json !== undefined && !isForm) h.set("Content-Type", "application/json");
    const t = tokenStore.get();
    if (auth && t) h.set("Authorization", `Bearer ${t.access}`);
    let res: Response;
    try {
      res = await fetch(`${baseUrl}${path}`, { ...rest, headers: h, body: json === undefined ? rest.body : isForm ? (json as FormData) : JSON.stringify(json) });
    } catch {
      throw new ApiError(0, `Can't reach the API at ${new URL(baseUrl).origin}. Check that Django is running and CORS_ALLOWED_ORIGINS includes this site's origin.`);
    }
    if (res.status === 401 && auth && retry && (await refresh())) return api<T>(path, init, false);
    if (res.status === 204) return undefined as T;
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(res.status, messageFrom(body, res.statusText || "Request failed"), body);
    return body as T;
  }

  return { api, tokenStore };
}
