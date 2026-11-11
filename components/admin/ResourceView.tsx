"use client";
import { RiAddLine, RiDeleteBin6Line, RiEditLine, RiMore2Fill, RiSearchLine } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, useAdmin } from "@/components/admin/Shell";
import { Avatar } from "@/components/base/avatar/avatar";
import { Chip, type ChipColor } from "@/components/base/badges/chip";
import { Button } from "@/components/base/buttons/button";
import { IconButton } from "@/components/base/buttons/icon-button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Dropdown, DropdownGroup, DropdownItem, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";
import { Input, InputBase } from "@/components/base/input/input";
import { AlertDialog, Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { Pagination } from "@/components/base/pagination/pagination";
import { Select, SelectItem } from "@/components/base/select/select";
import { Skeleton } from "@/components/base/skeleton/skeleton";
import { FileUpload } from "@/components/base/file-upload/file-upload";
import { Switch } from "@/components/base/switch/switch";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@/components/base/table/table";
import { Tab, TabList, Tabs } from "@/components/base/tabs/tabs";
import { Textarea } from "@/components/base/textarea/textarea";
import { toast } from "@/components/base/toast/toast";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { ChevronSortDown } from "@/components/foundations/icons/chevrons";
import { adminApi, ApiError, type Field, type Page, type Schema } from "@/lib/admin/api";
import { cx } from "@/utils/cx";
import { Focusable } from "react-aria-components";

const SKIP_COLS = new Set(["json", "text", "file", "relation-many"]);
const META = new Set(["created_at", "updated_at", "deleted_at", "tenant"]);
const PAGE_SIZE = 20;

function chipColor(value: string): ChipColor {
  const v = value.toUpperCase();
  if (/(FAIL|CANCEL|REJECT|DECLIN|EXPIRED|SUSPEND|BLOCK|OVERDUE)/.test(v)) return "rose";
  if (/(PENDING|WAIT|DRAFT|REVIEW|PARTIAL|HOLD|SCHEDULED|OPEN)/.test(v)) return "yellow";
  if (/(CONFIRM|SUCCEED|PAID|PUBLISH|ACTIVE|COMPLETE|APPROVED|SENT|RESOLVED|CLOSED)/.test(v)) return "lime";
  if (/(PROCESS|PROGRESS|NEW|INITIAT)/.test(v)) return "cyan";
  return "gray";
}

function Cell({ field, value }: { field: Field; value: any }) {
  if (value === null || value === undefined || value === "") return <span className="text-text-tertiary">—</span>;
  if (field.type === "boolean") return <Chip variant="caption" color={value ? "lime" : "gray"}>{value ? "Yes" : "No"}</Chip>;
  if (field.type === "choice" || /status|state/.test(field.name)) {
    const label = field.choices?.find((c) => c.value === value)?.label ?? String(value);
    return <Chip variant="caption" color={chipColor(String(value))}>{label}</Chip>;
  }
  if (field.type === "datetime") return <span className="whitespace-nowrap">{new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>;
  if (field.type === "date") return <span className="whitespace-nowrap">{new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>;
  if (field.type === "decimal") return <Chip variant="caption" color="gray">{Number(value).toLocaleString("en-IN")}</Chip>;
  if (field.type === "relation") {
    const option = field.options?.find((o) => o.value === String(value));
    if (option?.image_preview_url) {
      return (
        <span className="flex min-w-0 items-center gap-2">
          <img src={option.image_preview_url} alt="" className="size-10 shrink-0 rounded-md border border-border-button-default object-cover" />
          <span className="truncate">{option.label}</span>
        </span>
      );
    }
    return <>{option?.label ?? String(value)}</>;
  }
  return <span className="truncate">{String(value)}</span>;
}

type RowAction = { label: string; danger?: boolean; run: () => void };

export function ResourceView({ moduleKey, resourceKey }: { moduleKey: string; resourceKey: string }) {
  const router = useRouter();
  const { modules, groups } = useAdmin();
  const mod = modules.find((m) => m.key === moduleKey);
  const group = groups.find((g) => g.modules.some((m) => m.key === moduleKey));
  const [schema, setSchema] = useState<Schema | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  const [n, setN] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [ordering, setOrdering] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ row: any | null } | null>(null);
  const [confirm, setConfirm] = useState<any | null>(null);
  const [prompt, setPrompt] = useState<{ title: string; label: string; run: (text: string) => Promise<void> } | null>(null);

  useEffect(() => {
    setSchema(null); setPage(null); setN(1); setSearch(""); setQ(""); setOrdering(""); setErr("");
    adminApi.schema(resourceKey).then(setSchema).catch((e) => setErr(e.message));
  }, [resourceKey]);
  useEffect(() => { const t = setTimeout(() => { setQ(search); setN(1); }, 300); return () => clearTimeout(t); }, [search]);

  const load = useCallback(() => {
    if (!schema) return;
    const qs = new URLSearchParams({ page: String(n) });
    if (q) qs.set("search", q);
    if (ordering) qs.set("ordering", ordering);
    setLoading(true);
    adminApi.list(resourceKey, qs).then((p) => { setPage(p); setErr(""); }).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, [schema, n, q, ordering, resourceKey]);
  useEffect(load, [load]);

  const columns = useMemo(() => {
    const usable = (schema?.fields || []).filter((f) => f.name !== "id" && !SKIP_COLS.has(f.type));
    return [...usable.filter((f) => !META.has(f.name)), ...usable.filter((f) => META.has(f.name))].slice(0, 6);
  }, [schema]);
  const primary = columns.find((c) => c.type === "string") || columns[0];
  const pk = schema?.pk || "id";
  const sortable = new Set(schema?.ordering || []);
  const pages = page ? Math.max(1, Math.ceil(page.count / PAGE_SIZE)) : 1;
  const title = mod?.resources.find((r) => r.key === resourceKey)?.label || schema?.label || resourceKey;

  async function run(fn: () => Promise<unknown>, ok: string) {
    try { await fn(); toast(ok, { status: "success" }); load(); }
    catch (e: any) { toast(e.message || "Action failed", { status: "error" }); throw e; }
  }

  const rowActions = (row: any): RowAction[] => {
    const a: RowAction[] = [];
    const id = row[pk];
    if (resourceKey === "payments" && /PENDING/.test(String(row.status))) {
      a.push({ label: "Verify payment", run: () => run(() => adminApi.action("verify-payment", { payment_id: id, approved: true }), "Payment verified").catch(() => {}) });
      a.push({ label: "Reject payment", danger: true, run: () => setPrompt({ title: "Reject payment", label: "Reason", run: (note) => run(() => adminApi.action("verify-payment", { payment_id: id, approved: false, note }), "Payment rejected") }) });
    }
    if (resourceKey === "refunds" && /(PENDING|REQUESTED)/.test(String(row.status))) a.push({ label: "Approve refund", run: () => run(() => adminApi.action("approve-refund", { refund_id: id }), "Refund approved").catch(() => {}) });
    if (resourceKey === "bookings") a.push({ label: "Grant departure exception", run: () => setPrompt({ title: "Departure exception", label: "Reason", run: (reason) => run(() => adminApi.action("departure-exception", { booking_id: id, reason }), "Exception granted") }) });
    if (resourceKey === "participants" && !row.checked_in_at) a.push({ label: "Check in", run: () => run(() => adminApi.action("participant-check-in", { participant_id: id }), "Checked in").catch(() => {}) });
    const isTranslation = resourceKey.endsWith("-translations");
    if (isTranslation && schema?.actions.update) {
      // Review workflow for one language: Draft → Submitted → Under review → Approved. The parent's "Publish" then
      // publishes every approved language at once.
      const move = (label: string, status: string, done: string, danger = false) =>
        a.push({ label, danger, run: () => run(() => adminApi.action("content-transition", { resource: resourceKey, id, status }), done).catch(() => {}) });
      const st = String(row.status);
      if (st === "DRAFT" || st === "CHANGES_REQUESTED") move("Submit for review", "SUBMITTED", "Submitted for review");
      if (st === "SUBMITTED") move("Start review", "UNDER_REVIEW", "Review started");
      if (st === "UNDER_REVIEW") {
        move("Approve", "APPROVED", "Approved");
        move("Request changes", "CHANGES_REQUESTED", "Changes requested", true);
      }
      if (st === "REJECTED") move("Back to draft", "DRAFT", "Moved back to draft");
    } else if (schema?.fields.some((f) => f.name === "status" && f.choices?.some((c) => c.value === "PUBLISHED")) && row.status !== "PUBLISHED" && schema.actions.update)
      a.push({ label: "Publish", run: () => run(() => adminApi.action("content-transition", { resource: resourceKey, id, status: "PUBLISHED" }), "Published").catch(() => {}) });
    return a;
  };

  /** Phones: each row becomes a card (a wide table would need side-scrolling). */
  const mobileCards = (
    <ul className="flex flex-col gap-3 px-3 pb-3 md:hidden" aria-label={title}>
      {(page?.results ?? []).length === 0 && <li className="py-10 text-center text-body-medium text-text-tertiary">No records found.</li>}
      {(page?.results ?? []).map((row) => {
        const rowId = String(row[pk]);
        const extra = rowActions(row);
        const heading = primary ? String(row[primary.name] ?? "—") : rowId;
        return (
          <li key={rowId} className={cx("rounded-xl border border-border-button-default bg-background-primary-default p-3", loading && "opacity-60")}>
            <div className="flex items-center gap-2">
              <Avatar size="sm" color="neutral" initials={heading.slice(0, 2).toUpperCase()} />
              <span className="min-w-0 flex-1 truncate text-body-medium text-text-primary">{heading}</span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
              {columns.filter((c) => c !== primary).slice(0, 5).map((c) => (
                <div key={c.name} className="min-w-0">
                  <dt className="text-caption-1-medium text-text-tertiary">{c.label}</dt>
                  <dd className="min-w-0 break-words text-body-medium text-text-primary [&_span]:max-w-full [&_span]:!whitespace-normal">{<Cell field={c} value={row[c.name]} />}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              {schema?.actions.update && <Button size="medium" variant="secondary" leadingIcon={RiEditLine} onClick={() => setEditing({ row })}>Edit</Button>}
              {schema?.actions.delete && <Button size="medium" variant="secondary" leadingIcon={RiDeleteBin6Line} onClick={() => setConfirm(row)}>Delete</Button>}
              {extra.map((x) => <Button key={x.label} size="medium" variant={x.danger ? "danger" : "secondary"} onClick={x.run}>{x.label}</Button>)}
            </div>
          </li>
        );
      })}
    </ul>
  );

  const showNav = (group && group.modules.length > 1) || (mod && mod.resources.length > 1);

  return (
    <>
      <PageHeader
        crumbs={[mod?.label || moduleKey, title]}
        title={title}
        actions={schema?.actions.create ? <Button variant="primary" leadingIcon={RiAddLine} onClick={() => setEditing({ row: null })}>New {title.replace(/s$/, "").toLowerCase()}</Button> : null}
      />

      {showNav && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          {group && group.modules.length > 1 ? (
            <Tabs selectedKey={moduleKey} onSelectionChange={(k) => { const m = group.modules.find((x) => x.key === k); if (m) router.push(`/admin/${m.key}/${m.resources[0].key}`); }} className="!w-auto">
              <TabList aria-label="Section">{group.modules.map((m) => <Tab key={m.key} id={m.key}>{m.label}</Tab>)}</TabList>
            </Tabs>
          ) : <span />}
          {mod && mod.resources.length > 1 && (
            <Select aria-label="Record type" selectedKey={resourceKey} onSelectionChange={(k) => router.push(`/admin/${moduleKey}/${String(k)}`)} popoverClassName="min-w-56">
              {mod.resources.map((r) => <SelectItem key={r.key} id={r.key} textValue={r.label}>{r.label}</SelectItem>)}
            </Select>
          )}
        </div>
      )}

      <section className={cx("flex w-full flex-col rounded-2xl border border-border-table pt-2", pages > 1 ? "pb-3" : "pb-0")}>
        <div className="flex w-full flex-col items-start gap-3 px-3 py-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col justify-center">
            <p className="text-body-medium whitespace-nowrap text-text-tertiary">Total Results</p>
            <p className="text-body-medium whitespace-nowrap text-text-primary">{page ? page.count.toLocaleString("en-IN") : "…"} {title.toLowerCase()}</p>
          </div>
          <InputBase
            aria-label={`Search ${title}`} placeholder="Search" leadingIcon={RiSearchLine} value={search}
            disabled={!schema?.searchable.length}
            onChange={(e) => setSearch(e.target.value)}
            fieldClassName="w-full rounded-lg border border-border-button-default bg-background-primary-default sm:w-[220px]" className="text-body-medium"
          />
        </div>

        <div className="mt-2">
          {err ? (
            <div className="flex h-40 items-center justify-center px-4 text-center text-body-medium text-text-error-primary">{err}</div>
          ) : !schema || (loading && !page) ? (
            <div className="flex flex-col gap-2 px-3 pb-3">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
          ) : (
            <>
            <div className="max-md:hidden">
            <Table aria-label={title} size="sm" selectionMode="none" className="min-w-[720px]">
              <TableHeader>
                {[
                  ...columns.map((c) => (
                    <TableColumn key={c.name} id={c.name} isRowHeader={c === primary}>
                      {sortable.has(c.name) ? (
                        <button type="button" className="flex cursor-pointer items-center gap-0.5" onClick={() => setOrdering(ordering === c.name ? `-${c.name}` : c.name)}>
                          {c.label}
                          <ChevronSortDown className={cx("size-6 shrink-0 transition-transform", ordering === `-${c.name}` && "rotate-180", ordering.replace("-", "") === c.name ? "text-text-secondary" : "text-text-tertiary")} />
                        </button>
                      ) : c.label}
                    </TableColumn>
                  )),
                  <TableColumn key="__actions" id="__actions" className="w-[140px]">Actions</TableColumn>,
                ]}
              </TableHeader>
              <TableBody renderEmptyState={() => <div className="flex h-40 items-center justify-center text-body-medium text-text-tertiary">No records found.</div>}>
                {(page?.results ?? []).map((row) => {
                  const extra = rowActions(row);
                  const id = String(row[pk]);
                  return (
                    <TableRow key={id} id={id} className={loading ? "opacity-60" : undefined}>
                      {[
                        ...columns.map((c) => (
                          <TableCell key={c.name}>
                            {c === primary ? (
                              <div className="flex min-w-0 items-center gap-2">
                                <Avatar size="sm" color="neutral" initials={String(row[c.name] ?? "?").slice(0, 2).toUpperCase()} />
                                <span className="truncate text-body-medium text-text-primary">{String(row[c.name] ?? "—")}</span>
                              </div>
                            ) : <span className="text-body-medium text-text-primary"><Cell field={c} value={row[c.name]} /></span>}
                          </TableCell>
                        )),
                        <TableCell key="__actions">
                          <div className="flex items-center justify-end gap-2">
                            {schema.actions.delete && <Act label="Delete"><IconButton icon={RiDeleteBin6Line} size="small" aria-label="Delete" onClick={() => setConfirm(row)} /></Act>}
                            {schema.actions.update && <Act label="Edit"><IconButton icon={RiEditLine} size="small" aria-label="Edit" onClick={() => setEditing({ row })} /></Act>}
                            {extra.length > 0 && (
                              <Dropdown>
                                <DropdownTrigger aria-label="More actions" className="relative inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-2lg border border-border-button-default bg-background-primary-default text-foreground-icon-primary shadow-xs hover:border-border-button-hover hover:bg-background-primary-hover">
                                  <RiMore2Fill className="size-4" aria-hidden />
                                </DropdownTrigger>
                                <DropdownPopover aria-label="More actions" placement="bottom end" className="w-[220px] p-2">
                                  <DropdownGroup>
                                    {extra.map((x) => (
                                      <DropdownItem key={x.label} onSelect={x.run} className="px-2 py-1.5">
                                        <span className={cx("truncate text-body-medium whitespace-nowrap", x.danger ? "text-text-error-primary" : "text-text-primary")}>{x.label}</span>
                                      </DropdownItem>
                                    ))}
                                  </DropdownGroup>
                                </DropdownPopover>
                              </Dropdown>
                            )}
                          </div>
                        </TableCell>,
                      ]}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
            {mobileCards}
            </>
          )}
        </div>

        {pages > 1 && <div className="border-t border-separator-border px-3 pt-3"><Pagination page={n} totalPages={pages} onChange={setN} /></div>}
      </section>

      {schema && editing && <RecordForm schema={schema} row={editing.row} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); toast("Saved", { status: "success" }); load(); }} />}
      <AlertDialog isOpen={!!confirm} onOpenChange={(o) => !o && setConfirm(null)} title="Delete this record?" description="This permanently removes the record. The change is written to the audit log." confirmLabel="Delete" pendingLabel="Deleting…"
        onConfirm={() => run(() => adminApi.remove(resourceKey, String(confirm[pk])), "Deleted")} />
      {prompt && <PromptModal {...prompt} onClose={() => setPrompt(null)} />}
    </>
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

function Act({ label, children }: { label: string; children: React.ReactNode }) {
  return <TooltipTrigger delay={200}><Focusable>{children as any}</Focusable><Tooltip size="md">{label}</Tooltip></TooltipTrigger>;
}

function PromptModal({ title, label, run, onClose }: { title: string; label: string; run: (t: string) => Promise<void>; onClose: () => void }) {
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

function RecordForm({ schema, row, onClose, onSaved }: { schema: Schema; row: any | null; onClose: () => void; onSaved: () => void }) {
  const fields = schema.fields.filter((f) => !f.read_only);
  const blank = (f: Field) => (f.type === "boolean" ? false : f.many ? [] : "");
  const [vals, setVals] = useState<Record<string, any>>(() => Object.fromEntries(fields.map((f) => [f.name, row?.[f.name] ?? blank(f)])));
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
      if (row) await adminApi.update(schema.key, String(row[schema.pk || "id"]), payload); else await adminApi.create(schema.key, payload);
      onSaved();
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
              {fields.map((f) => {
                const v = vals[f.name];
                const label = f.label + (f.required ? " *" : "");
                const err = errors[f.name];
                const common = { label, isInvalid: !!err, hint: err || f.help_text || undefined };
                const wide = f.type === "text" || f.type === "json" || f.type === "file" || f.many;
                let input;
                if (f.type === "boolean") input = <Switch isSelected={!!v} onChange={(x) => set(f.name, x)}>{label}</Switch>;
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
