"use client";
import { RiAddLine, RiDeleteBin6Line, RiEditLine } from "@remixicon/react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { RecordForm } from "@/components/admin/ResourceView";
import { Button } from "@/components/base/buttons/button";
import { AlertDialog } from "@/components/base/modal/modal";
import { Skeleton } from "@/components/base/skeleton/skeleton";
import { toast } from "@/components/base/toast/toast";
import { adminApi, type Schema } from "@/lib/admin/api";

const schemas = new Map<string, Promise<Schema>>();
/** Schemas don't change while the page is open: fetch each one once. */
export const schemaOf = (key: string) => {
  if (!schemas.has(key)) schemas.set(key, adminApi.schema(key).catch((e) => { schemas.delete(key); throw e; }));
  return schemas.get(key)!;
};

type Row = Record<string, any>;

/**
 * One section of a trip/event page: the records of one type that belong to it (dates, FAQs, itinerary days…),
 * shown as a simple list with Add / Edit / Delete. Hidden entirely if the staff member can't view that type.
 */
export function RelatedList({
  resource, parentField, parentId, title, hint, addLabel, primary, secondary, extra, nested, sortBy, onChange, compact,
}: {
  resource: string; parentField: string; parentId: string; title: string; hint?: string; addLabel?: string;
  primary: (r: Row, schema: Schema) => ReactNode; secondary?: (r: Row, schema: Schema) => ReactNode;
  /** Extra buttons for a row (e.g. translation review steps); call reload() after changing something. */
  extra?: (r: Row, reload: () => void) => ReactNode;
  /** Child list shown under each row (e.g. the items of an itinerary day). */
  nested?: (r: Row) => ReactNode;
  sortBy?: string[]; onChange?: () => void;
  /** No card border: used for lists nested inside another list. */
  compact?: boolean;
}) {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [denied, setDenied] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState<{ row: Row | null } | null>(null);
  const [del, setDel] = useState<Row | null>(null);

  const sortKey = (sortBy ?? ["day_number", "sort_order", "starts_at", "language"]).join(",");
  const load = useCallback(() => {
    const qs = new URLSearchParams({ [parentField]: parentId, page_size: "100" });
    Promise.all([schemaOf(resource), adminApi.list(resource, qs)])
      .then(([s, page]) => {
        const keys = sortKey.split(",");
        const sorted = [...page.results].sort((a, b) => {
          for (const k of keys) if (a[k] !== b[k] && a[k] != null && b[k] != null) return a[k] < b[k] ? -1 : 1;
          return 0;
        });
        setSchema(s); setRows(sorted); setErr("");
      })
      .catch((e) => (e.status === 403 ? setDenied(true) : setErr(e.message)));
  }, [resource, parentField, parentId, sortKey]);
  useEffect(load, [load]);

  const changed = () => { load(); onChange?.(); };
  if (denied) return null;

  return (
    <section className={compact ? "" : "rounded-2xl border border-border-button-default bg-background-primary-default p-4"}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className={compact ? "text-body-medium text-text-secondary" : "text-headline-medium text-text-primary"}>{title}{rows ? <span className="ms-2 text-text-tertiary">{rows.length}</span> : null}</h3>
          {hint && <p className="text-body-regular text-text-secondary">{hint}</p>}
        </div>
        {schema?.actions.create && (
          <Button size="small" variant="secondary" leadingIcon={RiAddLine} onClick={() => setForm({ row: null })}>{addLabel ?? "Add"}</Button>
        )}
      </div>

      {err && <p className="text-body-regular text-text-error-primary">{err} <button className="underline" onClick={load}>Try again</button></p>}
      {!rows && !err && <Skeleton className="h-14 w-full rounded-xl" />}
      {rows && rows.length === 0 && <p className="rounded-xl bg-background-secondary-default px-4 py-5 text-center text-body-regular text-text-tertiary">Nothing added yet.</p>}
      {rows && rows.length > 0 && (
        <ul className="flex flex-col divide-y divide-separator-border">
          {rows.map((r) => (
            <li key={String(r[schema?.pk || "id"])} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-body-medium text-text-primary">{primary(r, schema!)}</div>
                  {secondary && <div className="mt-0.5 text-body-regular text-text-secondary">{secondary(r, schema!)}</div>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {extra?.(r, changed)}
                  {schema?.actions.update && <Button size="small" variant="secondary" leadingIcon={RiEditLine} onClick={() => setForm({ row: r })}>Edit</Button>}
                  {schema?.actions.delete && <Button size="small" variant="secondary" leadingIcon={RiDeleteBin6Line} onClick={() => setDel(r)}>Delete</Button>}
                </div>
              </div>
              {nested && <div className="mt-3 ms-4 border-s-2 border-separator-border ps-4">{nested(r)}</div>}
            </li>
          ))}
        </ul>
      )}

      {schema && form && (
        <RecordForm schema={schema} row={form.row} defaults={{ [parentField]: parentId }} hidden={[parentField]}
          onClose={() => setForm(null)} onSaved={() => { setForm(null); toast("Saved", { status: "success" }); changed(); }} />
      )}
      <AlertDialog isOpen={!!del} onOpenChange={(o) => !o && setDel(null)} title="Delete this item?" description="This can't be undone."
        confirmLabel="Delete" pendingLabel="Deleting…"
        onConfirm={async () => {
          try { await adminApi.remove(resource, String(del![schema?.pk || "id"])); toast("Deleted", { status: "success" }); changed(); }
          catch (e: any) { toast(e.message || "Couldn't delete", { status: "error" }); throw e; }
        }} />
    </section>
  );
}
