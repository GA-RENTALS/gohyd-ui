"use client";
/**
 * Hooks shared by the admin list pages (bookings, payments, customers, marketing, team).
 */
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/components/base/toast/toast";
import type { ListPage } from "@/lib/admin/api";

/** Filters kept in the URL (?type=…&status=…) so dashboard links and the back button land on the same view. */
export function useQueryState<T extends Record<string, string>>(defaults: T) {
  const router = useRouter();
  const [state, setState] = useState<T>(defaults);
  const stateRef = useRef(state);
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const next = Object.fromEntries(Object.keys(stateRef.current).map((k) => [k, qs.get(k) ?? stateRef.current[k]])) as T;
    stateRef.current = next;
    setState(next);
  }, []);
  const set = useCallback((patch: Partial<T>) => {
    const next = { ...stateRef.current, ...patch } as T;
    stateRef.current = next;
    setState(next);
    const qs = new URLSearchParams(Object.entries(next).filter(([k, v]) => v && v !== defaults[k]));
    router.replace(`${window.location.pathname}${qs.toString() ? `?${qs}` : ""}`, { scroll: false });
    // `defaults` is a literal at each call site; re-creating `set` for it would only cause extra renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);
  return [state, set] as const;
}

/** Waits until typing pauses before returning the new value. */
export function useDebounced<T>(value: T, ms = 300): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return settled;
}

/** The query string for a list request: the filters (empty ones dropped), the page and the search text. */
export function listQuery(params: Record<string, string>, page?: number, search?: string): URLSearchParams {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
  if (page) qs.set("page", String(page));
  if (search) qs.set("search", search);
  return qs;
}

/** Fetches a list page whenever the filters, page or (debounced) search change. Changing a filter goes back to page 1. */
/**
 * One page of a filtered list. `shapeParams` names the params that change what kind of row comes back (Marketing's
 * `tab`, Payments' `type`): while those differ from the shown rows' the list reports no data (loading), so the old
 * tab's rows are never drawn with the new tab's columns. Other filter changes keep the current rows until the new ones arrive.
 */
export function useList<T, R = ListPage<T>>(fetcher: (qs: URLSearchParams) => Promise<R>, params: Record<string, string>, search: string,
  shapeParams: string[] = []) {
  const [result, setResult] = useState<{ shape: string; data: R } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const latest = useRef(0);
  const q = useDebounced(search);
  const key = JSON.stringify(params);
  const shape = JSON.stringify(shapeParams.map((name) => params[name]));
  useEffect(() => setPage(1), [key, q]);
  const load = useCallback(() => {
    const request = ++latest.current;
    setLoading(true);
    fetcher(listQuery(params, page, q))
      .then((data) => { if (request === latest.current) setResult({ shape, data }); })   // a slower, older reply never wins
      .catch((e) => { if (request === latest.current) toast(e.message, { status: "error" }); })
      .finally(() => { if (request === latest.current) setLoading(false); });
    // `params` is captured through `key`, so the request only re-runs when a filter value actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, page, q]);
  useEffect(load, [load]);
  const data = result?.shape === shape ? result.data : null;
  return { data, loading, page, setPage, reload: load, search: q };
}

/** Runs one admin action at a time: shows a toast, reloads, and remembers which row is busy so its button can be disabled. */
export function useAction(after?: () => void) {
  const [busy, setBusy] = useState("");
  const run = useCallback(async (key: string, fn: () => Promise<unknown>, success: string) => {
    setBusy(key);
    try {
      await fn();
      toast(success, { status: "success" });
      after?.();
    } catch (e: any) {
      toast(e?.message || "Something went wrong", { status: "error" });
      throw e;
    } finally {
      setBusy("");
    }
  }, [after]);
  return { busy, run };
}
