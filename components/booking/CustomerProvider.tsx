"use client";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { customerApi, tokenStore } from "@/lib/customer/api";
import type { Profile } from "@/lib/customer/types";
import { ApiError } from "@/lib/api/client";

type CustomerContext = {
  /** The signed-in customer, or null when signed out. */
  user: Profile | null;
  /** True until we know whether someone is signed in. */
  loading: boolean;
  /** The customer is signed in, but their details couldn't be loaded (network or server trouble). Not a sign-out. */
  unreachable: boolean;
  /** Reloads the customer. Resolves to null when signed out; throws if the server can't be reached. */
  refresh: () => Promise<Profile | null>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<CustomerContext | null>(null);
const RETRY_MS = 3000;

export function useCustomer(): CustomerContext {
  const value = useContext(Ctx);
  if (!value) throw new Error("useCustomer must be used inside <CustomerProvider>");
  return value;
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreachable, setUnreachable] = useState(false);

  const refresh = useCallback(async (): Promise<Profile | null> => {
    if (!tokenStore.get()) {
      setUser(null); setUnreachable(false); setLoading(false);
      return null;
    }
    try {
      const me = await customerApi.me();
      setUser(me); setUnreachable(false); setLoading(false);
      return me;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {   // the session really ended
        tokenStore.clear();
        setUser(null); setUnreachable(false); setLoading(false);
        return null;
      }
      throw error;   // network or server trouble: keep the sign-in and whatever we already know
    }
  }, []);

  // First load: one quiet retry for a brief network blip, then tell the page we couldn't reach the server.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    refresh().catch(() => {
      timer = setTimeout(() => {
        refresh().catch(() => { setUnreachable(true); setLoading(false); });
      }, RETRY_MS);
    });
    return () => clearTimeout(timer);
  }, [refresh]);

  const signOut = useCallback(async () => {
    await customerApi.logout();
    setUser(null); setUnreachable(false);
  }, []);

  const value = useMemo(() => ({ user, loading, unreachable, refresh, signOut }), [user, loading, unreachable, refresh, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Only allow sending people back to a page on this site (never to another domain). */
export function safeNext(next: string | null | undefined, fallback = "/account"): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

/** Wrap a page that needs a signed-in customer: signed-out visitors are sent to the login page and brought back afterwards.
 *  If the customer is signed in but the server can't be reached, they get a retry instead of being sent to sign in again. */
export function RequireCustomer({ children }: { children: ReactNode }) {
  const { user, loading, unreachable, refresh } = useCustomer();
  const router = useRouter();
  const pathname = usePathname();
  const [retrying, setRetrying] = useState(false);
  useEffect(() => {
    if (!loading && !user && !unreachable) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, unreachable, router, pathname]);

  if (unreachable && !user) {
    const retry = () => { setRetrying(true); refresh().catch(() => {}).finally(() => setRetrying(false)); };
    return (
      <div role="alert">
        <p className="bk-note">We couldn't reach GoHyderabad just now. You're still signed in. Check your connection and try again.</p>
        <button type="button" className="btn btn-ghost" disabled={retrying} onClick={retry} style={{ marginTop: 12 }}>
          {retrying ? "Trying…" : "Try again"}
        </button>
      </div>
    );
  }
  if (loading || !user) return <p className="bk-note" role="status">Loading…</p>;
  return <>{children}</>;
}
