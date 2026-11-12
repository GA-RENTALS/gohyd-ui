"use client";
import { RiAddLine, RiDeleteBin6Line, RiEditLine } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, useAdmin } from "@/components/admin/Shell";
import { Card, type Column, DataTable, Drawer, Empty, FilterPills, nice, PageTitle, Pager, Person, SearchBox, StatusPill } from "@/components/admin/ui";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { AlertDialog, Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { Select, SelectItem } from "@/components/base/select/select";
import { FileUpload } from "@/components/base/file-upload/file-upload";
import { Switch } from "@/components/base/switch/switch";
import { Textarea } from "@/components/base/textarea/textarea";
import { toast } from "@/components/base/toast/toast";
import { ImageUpload, MediaThumb } from "@/components/admin/ImageUpload";
import { adminApi, ApiError, type Field, type Page, type Schema } from "@/lib/admin/api";
import { CORE_RESOURCES, overviewHref } from "@/lib/admin/nav";
import { cx } from "@/utils/cx";

const SKIP_COLS = new Set(["json", "text", "file", "relation-many"]);
const META = new Set(["created_at", "updated_at", "deleted_at", "tenant"]);
const PAGE_SIZE = 20;

export function Cell({ field, value }: { field: Field; value: any }) {
  if (value === null || value === undefined || value === "") return <span className="text-text-tertiary">—</span>;
  if (field.type === "boolean") return value ? <StatusPill status="YES" tone="green" label="Yes" /> : <span className="text-text-tertiary">No</span>;
  if (field.type === "choice" || /(^|_)(status|state)$/.test(field.name)) {
    const label = field.choices?.find((c) => c.value === value)?.label ?? nice(String(value));
    return /status|state/.test(field.name) ? <StatusPill status={String(value)} label={label} /> : <>{label}</>;
  }
  if (field.type === "datetime") return <span className="whitespace-nowrap">{new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>;
  if (field.type === "date") return <span className="whitespace-nowrap">{new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>;
  if (field.type === "decimal") return <span className="tabular-nums">{Number(value).toLocaleString("en-IN")}</span>;
  if (field.media && !field.many) return <MediaThumb id={String(value)} className="size-10" />;
  if (field.type === "relation") {
    const option = field.options?.find((o) => o.value === String(value));
    if (option?.image_preview_url) {
      return (
        <span className="flex min-w-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={option.image_preview_url} alt="" className="size-10 shrink-0 rounded-md border border-border-button-default object-cover" />
          <span className="truncate">{option.label}</span>
        </span>
      );
    }
    return <>{option?.label ?? <span className="text-text-tertiary">Linked record</span>}</>;
  }
  return <span className="line-clamp-2">{String(value)}</span>;
}

/** Fields worth a column, best first: names and titles, then status, money and dates. Raw ids and long text stay out. */
const PRIORITY = /^(name|title|full_name|question_en|text_en|label_en|label|subject|code|reference|slug|key|author_name|phone|email)$/;
function pickColumns(fields: Field[]): Field[] {
  const usable = fields.filter((f) =>
    f.name !== "id" && f.name !== "tenant" && f.name !== "sort_order" && !["json", "text", "file", "relation-many"].includes(f.type)
    && !(f.type === "relation" && !f.options && !f.media) && !/_(te|hi)$/.test(f.name));
  const score = (f: Field) => (PRIORITY.test(f.name) ? 0 : /(status|state)$/.test(f.name) ? 1 : f.type === "relation" ? 2 : f.type === "decimal" ? 3
    : /(created_at|updated_at)$/.test(f.name) ? 9 : 4);
  const picked = [...usable].sort((a, b) => score(a) - score(b)).slice(0, 5);
  return usable.filter((f) => picked.includes(f));   // keep the model's natural order among the chosen ones
}

type RowAction = { label: string; danger?: boolean; run: () => void };

export function ResourceView({ moduleKey, resourceKey }: { moduleKey: string; resourceKey: string }) {
  const router = useRouter();
  const { modules, refreshCounts } = useAdmin();
  const mod = modules.find((m) => m.key === moduleKey);
  const [schema, setSchema] = useState<Schema | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  const [n, setN] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ row: any | null } | null>(null);
  const [viewing, setViewing] = useState<any | null>(null);
  const [confirm, setConfirm] = useState<any | null>(null);
  const [prompt, setPrompt] = useState<{ title: string; label: string; run: (text: string) => Promise<void> } | null>(null);

  useEffect(() => {
    setSchema(null); setPage(null); setN(1); setSearch(""); setQ(""); setStatus("all"); setErr("");
    adminApi.schema(resourceKey).then(setSchema).catch((e) => setErr(e.message));
  }, [resourceKey]);
  useEffect(() => { const t = setTimeout(() => { setQ(search); setN(1); }, 300); return () => clearTimeout(t); }, [search]);

  const statusField = schema?.fields.find((f) => f.name === "status" && f.choices?.length);
  const load = useCallback(() => {
    if (!schema) return;
    const qs = new URLSearchParams({ page: String(n) });
    if (q) qs.set("search", q);
    if (status !== "all") qs.set("status", status);
    setLoading(true);
    adminApi.list(resourceKey, qs).then((p) => { setPage(p); setErr(""); }).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, [schema, n, q, status, resourceKey]);
  useEffect(load, [load]);

  const fields = useMemo(() => pickColumns(schema?.fields || []), [schema]);
  const pk = schema?.pk || "id";
  const pages = page ? Math.max(1, Math.ceil(page.count / PAGE_SIZE)) : 1;
  const title = mod?.resources.find((r) => r.key === resourceKey)?.label || schema?.label || resourceKey;
  const isCore = CORE_RESOURCES.has(resourceKey);
  const singular = title.replace(/s$/, "").toLowerCase();

  async function run(fn: () => Promise<unknown>, ok: string) {
    try { await fn(); toast(ok, { status: "success" }); load(); refreshCounts(); }
    catch (e: any) { toast(e.message || "Action failed", { status: "error" }); throw e; }
  }

  const view = (row: any) => {
    const href = overviewHref(resourceKey, String(row[pk]));
    if (href) router.push(href); else setViewing(row);
  };

  /** Status steps for a row (verify, confirm, publish…), shown as plain buttons. */
  const rowActions = (row: any): RowAction[] => {
    const a: RowAction[] = [];
    const id = row[pk];
    if (resourceKey === "payments" && /PENDING/.test(String(row.status))) {
      a.push({ label: "Verify", run: () => run(() => adminApi.action("verify-payment", { payment_id: id, approved: true }), "Payment verified").catch(() => {}) });
      a.push({ label: "Reject", danger: true, run: () => setPrompt({ title: "Reject payment", label: "Reason", run: (note) => run(() => adminApi.action("verify-payment", { payment_id: id, approved: false, note }), "Payment rejected") }) });
    }
    if (resourceKey === "refunds" && /(PENDING|REQUESTED)/.test(String(row.status))) a.push({ label: "Approve refund", run: () => run(() => adminApi.action("approve-refund", { refund_id: id }), "Refund approved").catch(() => {}) });
    if (resourceKey === "enquiries" && row.status === "NEW" && schema?.actions.update) a.push({ label: "Mark contacted", run: () => run(() => adminApi.update(resourceKey, String(id), { status: "CONTACTED" }), "Marked as contacted").catch(() => {}) });
    if (resourceKey === "participants" && !row.checked_in_at) a.push({ label: "Check in", run: () => run(() => adminApi.action("participant-check-in", { participant_id: id }), "Checked in").catch(() => {}) });
    // Translations need no review step: they show on the website as soon as they are added.
    if (!resourceKey.endsWith("-translations") && statusField?.choices?.some((c) => c.value === "PUBLISHED") && row.status !== "PUBLISHED" && schema?.actions.update)
      a.push({ label: "Publish", run: () => run(() => adminApi.action("content-transition", { resource: resourceKey, id, status: "PUBLISHED" }), "Published").catch(() => {}) });
    return a;
  };

  const columns: Column<any>[] = fields.map((f, i) => ({
    key: f.name, label: f.label,
    align: f.type === "decimal" || f.type === "integer" ? "end" as const : undefined,
    hideOnMobile: /(created_at|updated_at)$/.test(f.name),
    render: (row: any) => i === 0 && f.type === "string"
      ? <Person name={String(row[f.name] ?? "—")} sub={fields[1]?.type === "string" ? String(row[fields[1].name] ?? "") : undefined} />
      : <Cell field={f} value={row[f.name]} />,
  }));
  // the second text column is already shown under the name
  if (fields[0]?.type === "string" && fields[1]?.type === "string") columns.splice(1, 1);

  return (
    <>
      {isCore
        ? <PageTitle title={title} actions={schema?.actions.create ? <Button variant="primary" leadingIcon={RiAddLine} onClick={() => setEditing({ row: null })}>Add {singular}</Button> : null} />
        : <PageHeader crumbs={[{ label: "All data", href: "/admin/all" }, mod?.label || moduleKey, title]} title={title}
            actions={schema?.actions.create ? <Button variant="primary" leadingIcon={RiAddLine} onClick={() => setEditing({ row: null })}>Add {singular}</Button> : null} />}

      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-separator-border p-3">
          {statusField ? (
            <FilterPills value={status} onChange={(v) => { setStatus(v); setN(1); }}
              options={[{ key: "all", label: "All" }, ...statusField.choices!.slice(0, 6).map((c) => ({ key: c.value, label: c.label }))]} />
          ) : <span className="px-1 text-body-medium text-text-secondary">{page ? `${page.count.toLocaleString("en-IN")} ${page.count === 1 ? singular : title.toLowerCase()}` : "…"}</span>}
          <div className="flex-1" />
          {!!schema?.searchable.length && <SearchBox value={search} onChange={setSearch} placeholder={`Search ${title.toLowerCase()}`} />}
        </div>
        {err ? (
          <Empty title="Couldn't load this list" sub={err} action={<Button size="small" variant="secondary" onClick={load}>Try again</Button>} />
        ) : (
          <DataTable rows={schema ? page?.results ?? null : null} loading={loading} rowKey={(r) => String(r[pk])} columns={columns} onRowClick={view}
            empty={<Empty title={q ? `Nothing matches “${q}”` : `No ${title.toLowerCase()} yet`} sub={schema?.actions.create && !q ? `Use “Add ${singular}” to create the first one.` : undefined} />}
            actions={(row) => {
              const extra = rowActions(row);
              if (!extra.length && !schema?.actions.update && !schema?.actions.delete) return null;
              return <>
                {extra.map((x) => <Button key={x.label} size="small" variant={x.danger ? "secondary" : "primary"} onClick={x.run}>{x.label}</Button>)}
                {schema?.actions.update && <IconBtn label="Edit" onClick={() => setEditing({ row })}><RiEditLine className="size-4" /></IconBtn>}
                {schema?.actions.delete && <IconBtn label="Delete" onClick={() => setConfirm(row)} danger><RiDeleteBin6Line className="size-4" /></IconBtn>}
              </>;
            }} />
        )}
        {page && <Pager page={n} pages={pages} count={page.count} onChange={setN} />}
      </Card>

      {schema && editing && <RecordForm schema={schema} row={editing.row} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); toast("Saved", { status: "success" }); load(); }} />}
      {schema && viewing && (
        <RecordDetails schema={schema} row={viewing} onClose={() => setViewing(null)}
          onEdit={schema.actions.update ? () => { setEditing({ row: viewing }); setViewing(null); } : undefined} />
      )}
      <AlertDialog isOpen={!!confirm} onOpenChange={(o) => !o && setConfirm(null)} title={`Delete this ${singular}?`}
        description="This permanently removes the record. Records that customers have booked or paid for can't be deleted; you'll be told what to do instead." confirmLabel="Delete" pendingLabel="Deleting…"
        onConfirm={() => run(() => adminApi.remove(resourceKey, String(confirm[pk])), "Deleted")} />
      {prompt && <PromptModal {...prompt} onClose={() => setPrompt(null)} />}
    </>
  );
}

function IconBtn({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className={cx("grid size-8 place-items-center rounded-lg border border-border-button-default text-foreground-icon-secondary transition-colors hover:bg-background-secondary-default",
        danger && "hover:border-rose-500/40 hover:text-rose-600")}>{children}</button>
  );
}

/** Read-only view of one record in a side panel. */
export function RecordDetails({ schema, row, onClose, onEdit }: { schema: Schema; row: any; onClose: () => void; onEdit?: () => void }) {
  const fields = schema.fields.filter((f) => f.name !== "tenant" && f.name !== "id");
  const heading = fields.find((f) => PRIORITY.test(f.name));
  return (
    <Drawer open onClose={onClose} title={heading ? String(row[heading.name] ?? schema.label) : schema.label.replace(/s$/, "")} sub={schema.label.replace(/s$/, "")}
      footer={onEdit && <Button variant="primary" leadingIcon={RiEditLine} onClick={onEdit}>Edit</Button>}>
      <dl className="flex flex-col divide-y divide-separator-border">
        {fields.map((f) => {
          const v = row[f.name];
          let shown: React.ReactNode;
          if (f.type === "file" && typeof v === "string" && v) {
            shown = /\.(jpe?g|png|webp|gif)(\?|$)/i.test(v)
              ? <a href={v} target="_blank" rel="noopener noreferrer">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={v} alt={f.label} className="max-h-72 rounded-lg border border-border-button-default object-contain" /></a>
              : <a href={v} target="_blank" rel="noopener noreferrer" className="underline">Open file</a>;
          } else if (f.type === "json") shown = <pre className="max-h-48 overflow-auto rounded-lg bg-background-secondary-default p-2 text-caption-1-medium">{JSON.stringify(v ?? null, null, 2)}</pre>;
          else if (f.many) shown = (v || []).length ? (v as string[]).map((x) => f.options?.find((o) => o.value === String(x))?.label ?? x).join(", ") : <span className="text-text-tertiary">—</span>;
          else if (f.type === "text") shown = v ? <p className="whitespace-pre-wrap">{String(v)}</p> : <span className="text-text-tertiary">—</span>;
          else shown = <Cell field={f} value={v} />;
          return (
            <div key={f.name} className="grid grid-cols-[140px_1fr] gap-3 py-2.5">
              <dt className="text-body-regular text-text-tertiary">{f.label}</dt>
              <dd className="min-w-0 break-words text-body-medium text-text-primary">{shown}</dd>
            </div>
          );
        })}
      </dl>
    </Drawer>
  );
}

/** Multipart body for file uploads: arrays repeat the key, booleans become "true"/"false", JSON is stringified, null clears (empty string). */
function toFormData(body: Record<string, any>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(body)) {
    if (value instanceof File) form.append(key, value);
    else if (Array.isArray(value)) value.forEach((item) => form.append(key, String(item)));
    else if (value === null || value === undefined) form.append(key, "");
    else if (typeof value === "object") form.append(key, JSON.stringify(value));
    else form.append(key, String(value));
  }
  return form;
}

export function PromptModal({ title, label, run, onClose }: { title: string; label: string; run: (t: string) => Promise<void>; onClose: () => void }) {
  const [t, setT] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal isOpen onOpenChange={(o) => !o && onClose()} size="sm">
      {({ close }) => (
        <>
          <ModalHeader title={title} />
          <ModalBody><Textarea label={label} value={t} onChange={setT} rows={3} /></ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button variant="primary" disabled={!t.trim() || busy} onClick={async () => { setBusy(true); try { await run(t.trim()); close(); } catch { setBusy(false); } }}>Confirm</Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}

export function RecordForm({ schema, row, defaults, hidden, onClose, onSaved }: { schema: Schema; row: any | null; defaults?: Record<string, any>; hidden?: string[]; onClose: () => void; onSaved: (saved?: any) => void }) {
  const fields = schema.fields.filter((f) => !f.read_only);
  const blank = (f: Field) => (f.type === "boolean" ? false : f.many ? [] : "");
  const [vals, setVals] = useState<Record<string, any>>(() => Object.fromEntries(fields.map((f) => [f.name, row?.[f.name] ?? defaults?.[f.name] ?? blank(f)])));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formErr, setFormErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setVals((s) => ({ ...s, [k]: v }));

  async function save() {
    setBusy(true); setErrors({}); setFormErr("");
    const body: Record<string, any> = {};
    for (const f of fields) {
      let v = vals[f.name];
      if (f.type === "file" && !(v instanceof File)) continue;   // only send a file the person actually chose
      if (row && JSON.stringify(v) === JSON.stringify(row[f.name] ?? blank(f))) continue;
      if (v === "" && (f.allow_null || !f.required)) v = f.type === "string" || f.type === "text" ? "" : null;
      if (f.type === "json" && typeof v === "string") { try { v = v ? JSON.parse(v) : null; } catch { setErrors({ [f.name]: "Enter valid JSON." }); setBusy(false); return; } }
      body[f.name] = v;
    }
    const payload = Object.values(body).some((v) => v instanceof File) ? toFormData(body) : body;
    try {
      const saved = row ? await adminApi.update(schema.key, String(row[schema.pk || "id"]), payload) : await adminApi.create(schema.key, payload);
      onSaved(saved);
    } catch (e) {
      const er = e as ApiError;
      if (er.body && typeof er.body === "object") {
        const m: Record<string, string> = {};
        for (const [k, v] of Object.entries(er.body as Record<string, any>)) if (k !== "detail") m[k] = Array.isArray(v) ? v.join(" ") : String(v);
        setErrors(m);
      }
      setFormErr(er.message);
    } finally { setBusy(false); }
  }

  return (
    <Modal isOpen onOpenChange={(o) => !o && onClose()} size="lg">
      {({ close }) => (
        <>
          <ModalHeader title={row ? `Edit ${schema.label}` : `New ${schema.label}`} />
          <ModalBody>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.filter((f) => !hidden?.includes(f.name)).map((f) => {
                const v = vals[f.name];
                const label = f.label + (f.required ? " *" : "");
                const err = errors[f.name];
                const common = { label, isInvalid: !!err, hint: err || f.help_text || undefined };
                const wide = f.type === "text" || f.type === "json" || f.type === "file" || f.many || f.media;
                let input;
                if (f.type === "boolean") input = <Switch isSelected={!!v} onChange={(x) => set(f.name, x)}>{label}</Switch>;
                else if (f.media && !f.many) input = <ImageUpload label={label} value={v ? String(v) : ""} onChange={(id) => set(f.name, id)} hint={f.help_text || undefined} error={err} />;
                else if (f.type === "choice" || (f.type.startsWith("relation") && !f.many && f.options)) {
                  const opts = f.type === "choice" ? f.choices! : f.options!;
                  input = (
                    <Select label={label} selectedKey={v === "" || v == null ? "" : String(v)} onSelectionChange={(k) => set(f.name, String(k))} popoverClassName="min-w-56">
                      {[{ value: "", label: "—" }, ...opts].map((o) => <SelectItem key={o.value || "__none"} id={o.value} textValue={o.label}>{o.label}</SelectItem>)}
                    </Select>
                  );
                } else if (f.many && f.options) {
                  input = (
                    <div className="flex flex-col gap-2">
                      <span className="text-body-medium text-text-secondary">{label}</span>
                      <div className="flex max-h-40 flex-col gap-2 overflow-y-auto rounded-xl border border-border-button-default p-3">
                        {f.options.map((o) => (
                          <Checkbox key={o.value} isSelected={(v || []).includes(o.value)} onChange={(on) => set(f.name, on ? [...(v || []), o.value] : (v || []).filter((x: string) => x !== o.value))}>{o.label}</Checkbox>
                        ))}
                      </div>
                    </div>
                  );
                } else if (f.type === "file") {
                  const current = typeof row?.[f.name] === "string" ? row[f.name] : "";
                  const allowedExtensions = schema.key === "media-assets" && f.name === "file"
                    ? vals.kind === "image" ? ["jpg", "jpeg", "png", "webp", "gif"]
                      : vals.kind === "video" ? ["mp4"]
                        : ["pdf", "csv", "txt", "doc", "docx", "xls", "xlsx"]
                    : (f.accept || "").split(",").map((x) => x.replace(".", "")).filter(Boolean);
                  input = (
                    <div className="flex flex-col gap-2">
                      <span className="text-body-medium text-text-secondary">{label}</span>
                      {current && !(v instanceof File) && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(current) && (
                        <a href={current} target="_blank" rel="noopener noreferrer" className="block w-fit">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={current} alt={label} className="max-h-96 max-w-full rounded-lg border border-border-button-default object-contain" />
                        </a>
                      )}
                      {current && !(v instanceof File) && (
                        <a href={current} target="_blank" rel="noopener noreferrer" className="text-body-medium text-text-secondary underline">View current file</a>
                      )}
                      {v instanceof File && <p className="text-body-medium text-text-primary">Ready to upload: {v.name}</p>}
                      <FileUpload
                        allowedExtensions={allowedExtensions}
                        maxBytes={(f.max_mb || 5) * 1024 * 1024}
                        onUploadComplete={(file) => set(f.name, file)}
                      />
                      {err && <p className="text-body-regular text-text-error-primary">{err}</p>}
                    </div>
                  );
                } else if (f.type === "text") input = <Textarea {...common} value={v ?? ""} onChange={(x) => set(f.name, x)} rows={3} />;
                else if (f.type === "json") input = <Textarea {...common} value={typeof v === "string" ? v : JSON.stringify(v ?? null, null, 2)} onChange={(x) => set(f.name, x)} rows={5} />;
                else {
                  const type = ({ integer: "number", decimal: "number", date: "date", datetime: "datetime-local", email: "email", url: "url" } as Record<string, string>)[f.type] || "text";
                  input = <Input {...common} type={type} value={type === "datetime-local" && v ? String(v).slice(0, 16) : v ?? ""} onChange={(x) => set(f.name, x)} errorMessage={err} />;
                }
                return <div key={f.name} className={wide ? "sm:col-span-2" : undefined}>{input}</div>;
              })}
            </div>
            {formErr && !Object.keys(errors).length && <p role="alert" className="mt-3 text-body-regular text-text-error-primary">{formErr}</p>}
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}
