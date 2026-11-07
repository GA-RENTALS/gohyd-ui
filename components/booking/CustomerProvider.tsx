"use client";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { customerApi, tokenStore } from "@/lib/customer/api";
import type { Profile } from "@/lib/customer/types";

type CustomerContext = {
  /** The signed-in customer, or null when signed out. */
  user: Profile | null;
  /** True until we know whether someone is signed in. */
  loading: boolean;
  refresh: () => Promise<Profile | null>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<CustomerContext | null>(null);

export function useCustomer(): CustomerContext {
  const value = useContext(Ctx);
  if (!value) throw new Error("useCustomer must be used inside <CustomerProvider>");
  return value;
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) { setUser(null); setLoading(false); return null; }
    try {
      const me = await customerApi.me();
      setUser(me);
      return me;
    } catch {
      tokenStore.clear();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const signOut = useCallback(async () => {
    await customerApi.logout();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, refresh, signOut }), [user, loading, refresh, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Only allow sending people back to a page on this site (never to another domain). */
export function safeNext(next: string | null | undefined, fallback = "/account"): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

/** Wrap a page that needs a signed-in customer: signed-out visitors are sent to the login page and brought back afterwards. */
export function RequireCustomer({ children }: { children: ReactNode }) {
  const { user, loading } = useCustomer();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);
  if (loading || !user) return <p className="bk-note" role="status">Loading…</p>;
  return <>{children}</>;
}
