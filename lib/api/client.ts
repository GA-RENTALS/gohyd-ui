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

  refreshing ||= (async () => {
    let response: Response;

    try {
      response = await fetch(`${baseUrl}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: t.refresh }),
      });
    } catch {
      throw new ApiError(0, "Unable to reach the authentication server.");
    }

    // Only confirmed refresh-token rejection means the session is invalid.
    if ([400, 401].includes(response.status)) {
  return false;
}

    // Preserve the session if the server has a temporary failure.
    if (!response.ok) {
      throw new ApiError(
        response.status,
        "Unable to refresh your session. Please retry."
      );
    }

    const data = await response.json();

    if (!data.access) {
      throw new ApiError(500, "Invalid token refresh response.");
    }

    tokenStore.set({
      access: data.access,
      refresh: data.refresh || t.refresh,
    });

    return true;
  })().finally(() => {
    refreshing = null;
  });

  return refreshing;
}

  /** Sends the request with the access token, refreshing it once on a 401. Throws ApiError for any non-2xx answer. */
  async function send(path: string, init: RequestOptions = {}, retry = true): Promise<Response> {
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
    if (res.status === 401 && auth && retry && (await refresh())) return send(path, init, false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new ApiError(res.status, messageFrom(body, res.statusText || "Request failed"), body);
    }
    return res;
  }

  async function api<T = any>(path: string, init: RequestOptions = {}): Promise<T> {
    const res = await send(path, init);
    if (res.status === 204) return undefined as T;
    return (await res.json().catch(() => null)) as T;
  }

  /** Fetches a file (e.g. a CSV export) with the same sign-in, and hands it to the browser as a download. */
  async function download(path: string, fallbackName: string): Promise<void> {
    const res = await send(path);
    const disposition = res.headers.get("Content-Disposition") || "";
    const name = /filename="([^"]+)"/.exec(disposition)?.[1] || fallbackName;
    const url = URL.createObjectURL(await res.blob());
    const link = Object.assign(document.createElement("a"), { href: url, download: name });
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return { api, download, tokenStore };
}
