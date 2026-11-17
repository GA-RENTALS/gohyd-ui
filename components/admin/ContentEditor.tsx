"use client";
import { RiDeleteBin6Line, RiExternalLinkLine, RiEyeOffLine, RiRefreshLine, RiSave3Line } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormSubmit } from "@/components/admin/FormModal";
import { ImageUpload, MediaThumb } from "@/components/admin/ImageUpload";
import { MainDetails, optionLabel, PhotosCard } from "@/components/admin/Overview";
import { RelatedList } from "@/components/admin/RelatedList";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { SchedulePublishButton } from "@/components/admin/SchedulePublishButton";
import { PageHeader } from "@/components/admin/Shell";
import { Card, StatusPill } from "@/components/admin/ui";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { AlertDialog } from "@/components/base/modal/modal";
import { Select, SelectItem } from "@/components/base/select/select";
import { Skeleton } from "@/components/base/skeleton/skeleton";
import { Tab, TabList, Tabs } from "@/components/base/tabs/tabs";
import { Textarea } from "@/components/base/textarea/textarea";
import { toast } from "@/components/base/toast/toast";
import { adminApi, type BlogPost, type ContentItem, type ContentKind, type ContentText, type Lang } from "@/lib/admin/api";
import { CONTENT_KINDS, type ContentKindConfig } from "@/lib/admin/content-kinds";

const LANGS: { code: Lang; label: string }[] = [{ code: "en", label: "English" }, { code: "te", label: "Telugu" }, { code: "hi", label: "Hindi" }];
const when = (v: string) => new Date(v).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

type Draft = Omit<ContentText, "id">;
const EMPTY: Draft = { title: "", summary: "", body: "", seo_title: "", seo_description: "" };
const draftOf = (t?: ContentText): Draft => (t ? { title: t.title, summary: t.summary, body: t.body, seo_title: t.seo_title, seo_description: t.seo_description } : EMPTY);
const sameDraft = (a: Draft, b: Draft) => (Object.keys(EMPTY) as (keyof Draft)[]).every((k) => (a[k] || "") === (b[k] || ""));

/** One blog post, website page or destination on one page: its text in each language, its details, and publishing. */
export function ContentEditor({ kind, id }: { kind: ContentKind; id: string }) {
  const cfg = CONTENT_KINDS[kind];
  const router = useRouter();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [err, setErr] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [unsaved, setUnsaved] = useState<Partial<Record<Lang, boolean>>>({});
  const [busy, setBusy] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => adminApi.contentItem(kind, id).then((d) => { setItem(d); setErr(""); }).catch((e) => setErr(e.message)), [kind, id]);
  useEffect(() => { load(); }, [load]);

  const dirty = Object.values(unsaved).some(Boolean);
  // Leaving the page with unsaved text asks first (the browser's own prompt).
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const markUnsaved = useCallback((code: Lang, value: boolean) => setUnsaved((u) => (u[code] === value ? u : { ...u, [code]: value })), []);

  async function transition(status: "PUBLISHED" | "DRAFT") {
    setBusy(status);
    try {
      await adminApi.action("content-transition", { resource: cfg.resource, id, status });
      toast(status === "PUBLISHED" ? `Published. The ${cfg.singular} is on the website.` : `Unpublished. The ${cfg.singular} is off the website.`, { status: "success" });
      await load();
    } catch (e: any) { toast(e.message || "Something went wrong", { status: "error" }); }
    finally { setBusy(""); }
  }

  if (err) return (
    <>
      <PageHeader crumbs={[{ label: cfg.title, href: cfg.listHref }, "Not found"]} title={`Couldn't open this ${cfg.singular}`} />
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-body-medium text-text-error-primary">{err}</p>
        <Button variant="secondary" onClick={load}>Try again</Button>
      </div>
    </>
  );
  if (!item) return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-16 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]"><Skeleton className="h-[560px] rounded-2xl" /><Skeleton className="h-80 rounded-2xl" /></div>
    </div>
  );

  const p = item.permissions;
  const live = item.status === "PUBLISHED";
  const text = (
    <div className="min-w-0">
      <Tabs selectedKey={lang} onSelectionChange={(k) => setLang(k as Lang)} className="mb-4 !w-auto max-w-full overflow-x-auto">
        <TabList aria-label="Language">
          {LANGS.map((l) => (
            <Tab key={l.code} id={l.code}>
              {l.label}{l.code !== "en" && !item.translations[l.code] ? " · not added" : ""}{unsaved[l.code] ? " •" : ""}
            </Tab>
          ))}
        </TabList>
      </Tabs>
      {/* All three stay mounted so switching language never throws away typing. */}
      {LANGS.map((l) => (
        <div key={l.code} hidden={lang !== l.code}>
          <TextForm key={`${l.code}-${item.translations[l.code]?.id ?? "new"}`} item={item} cfg={cfg} lang={l.code} label={l.label}
            onUnsaved={markUnsaved} onSaved={load} />
        </div>
      ))}
    </div>
  );

  return (
    <>
      <PageHeader
        crumbs={[{ label: cfg.title, href: cfg.listHref }, item.title]}
        title={item.title}
        actions={<>
          <Button variant="secondary" leadingIcon={RiRefreshLine} onClick={load} disabled={dirty}>Refresh</Button>
          {live && (
            <a href={item.public_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-button-default px-3 text-body-medium text-text-primary hover:bg-background-secondary-default">
              <RiExternalLinkLine className="size-4" aria-hidden /> View on site
            </a>
          )}
          {p.edit && (live
            ? <Button variant="secondary" leadingIcon={RiEyeOffLine} disabled={!!busy} onClick={() => transition("DRAFT")}>Unpublish</Button>
            : <>
              <SchedulePublishButton resource={cfg.resource} id={id} status={item.status} onChanged={load} disabled={!!busy || dirty} />
              <Button variant="primary" disabled={!!busy || dirty} onClick={() => transition("PUBLISHED")}>Publish now</Button>
            </>)}
          {p.delete && <Button variant="danger" leadingIcon={RiDeleteBin6Line} onClick={() => setDeleting(true)}>Delete</Button>}
        </>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-body-regular text-text-secondary">
        <StatusPill status={item.status} tone={live ? "green" : item.status === "SCHEDULED" ? "blue" : "amber"}
          label={live ? "Live on website" : item.status === "SCHEDULED" ? `Scheduled for ${when(item.publish_at || "")}` : "Draft: not on website"} />
        <span>Last edited {when(item.updated_at)}{kind === "blogs" && (item as BlogPost).author ? ` · written by ${(item as BlogPost).author}` : ""}</span>
        {dirty && <span className="text-text-error-primary">· Unsaved changes{!live && p.edit ? ": save them before publishing" : ""}</span>}
      </div>

      {kind === "blogs" ? (
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          {text}
          <BlogSettingsCard post={item as BlogPost} onSaved={load} />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {text}
          {kind === "pages" && item.slug_locked && !item.published_at && (
            <p className="text-body-regular text-text-secondary">The website links to {item.public_url}, so this page keeps that address.</p>
          )}
          <MainDetails resource={cfg.resource} id={id} onSaved={load} />
          {kind === "destinations" && <DestinationExtras id={id} onSaved={load} />}
        </div>
      )}

      <AlertDialog isOpen={deleting} onOpenChange={(o) => !o && setDeleting(false)} title={`Delete “${item.title}”?`}
        description={live ? `This ${cfg.singular} is on the website. Unpublish it first, then delete it.`
          : item.status === "SCHEDULED" ? `This ${cfg.singular} is scheduled to go live. Cancel the schedule first, then delete it.`
          : `This permanently removes the ${cfg.singular} and its text in every language.`}
        confirmLabel="Delete" pendingLabel="Deleting…"
        onConfirm={async () => {
          try {
            await adminApi.deleteContent(kind, id);
            toast(`Deleted`, { status: "success" });
            router.push(cfg.listHref);
          } catch (e: any) { toast(e.message || "Couldn't delete", { status: "error" }); throw e; }
        }} />
    </>
  );
}

/** Title, summary, body and search-engine text for one language. English always exists; Telugu and Hindi are optional. */
function TextForm({ item, cfg, lang, label, onUnsaved, onSaved }: {
  item: ContentItem; cfg: ContentKindConfig; lang: Lang; label: string; onUnsaved: (lang: Lang, unsaved: boolean) => void; onSaved: () => void;
}) {
  const saved = item.translations[lang];
  const p = item.permissions;
  const canWrite = saved ? p.edit_text : p.add_text;
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => draftOf(saved));
  const [removing, setRemoving] = useState(false);
  const [editorKey, setEditorKey] = useState(0);   // bumped to load new HTML into the (uncontrolled) editor
  const { busy, errors, general, submit } = useFormSubmit();
  const original = useMemo(() => draftOf(saved), [saved]);
  const changed = !sameDraft(draft, original);
  useEffect(() => { onUnsaved(lang, changed); }, [lang, changed, onUnsaved]);
  const set = <K extends keyof Draft>(k: K) => (v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  if (!saved && !adding) return (
    <Card>
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <p className="text-body-medium text-text-primary">No {label} version yet.</p>
        <p className="max-w-md text-body-regular text-text-secondary">Visitors who choose {label} see the English text until you add one. It shows on the website as soon as you save it.</p>
        {p.add_text && <Button className="mt-2" variant="primary" onClick={() => setAdding(true)}>Add {label} version</Button>}
      </div>
    </Card>
  );

  const save = () => submit(async () => {
    const fields = (Object.keys(EMPTY) as (keyof Draft)[]).filter((k) => !saved || draft[k] !== original[k]);
    const changes = Object.fromEntries(fields.map((k) => [k, draft[k].trim()]));
    const row = (saved
      ? await adminApi.update(cfg.textResource, String(saved.id), changes)
      : await adminApi.create(cfg.textResource, { ...changes, [cfg.parentField]: item.id, language: lang })) as ContentText;
    // The server tidies the HTML (content/html.py). Show its version, so the form isn't left looking unsaved.
    setDraft(draftOf(row));
    setEditorKey((n) => n + 1);
    toast(`${label} text saved`, { status: "success" });
    onSaved();
  });

  return (
    <Card>
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (changed && !busy) save(); }} noValidate>
        <Input label={`${cfg.parentField === "destination" ? "Name" : "Title"} (${label}) *`} value={draft.title} onChange={set("title")} isReadOnly={!canWrite}
          maxLength={item.limits.title} isInvalid={!!errors.title} errorMessage={errors.title} />
        <Textarea label="Summary" value={draft.summary} onChange={set("summary")} isReadOnly={!canWrite} rows={2}
          hint={errors.summary || cfg.summaryHint} isInvalid={!!errors.summary} />
        <div>
          <RichTextEditor key={editorKey} label={cfg.bodyLabel} value={draft.body} onChange={set("body")} readOnly={!canWrite} hint={cfg.bodyHint} />
          {errors.body && <p className="mt-1 text-body-regular text-text-error-primary">{errors.body}</p>}
        </div>
        <fieldset className="flex flex-col gap-4 rounded-xl border border-border-button-default p-4">
          <legend className="px-1 text-body-medium text-text-secondary">Search engines (optional)</legend>
          <Input label="Search title" value={draft.seo_title} onChange={set("seo_title")} isReadOnly={!canWrite} maxLength={item.limits.seo_title}
            placeholder={draft.title} isInvalid={!!errors.seo_title} errorMessage={errors.seo_title}
            hint={`${draft.seo_title.length}/${item.limits.seo_title}. Leave empty to use the title.`} />
          <Textarea label="Search description" value={draft.seo_description} onChange={set("seo_description")} isReadOnly={!canWrite} rows={2}
            maxLength={item.limits.seo_description} showCount placeholder={draft.summary}
            hint={errors.seo_description || "Leave empty to use the summary."} isInvalid={!!errors.seo_description} />
        </fieldset>
        {general && <p role="alert" className="text-body-regular text-text-error-primary">{general}</p>}
        {canWrite && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              {saved && lang !== "en" && p.delete_text && (
                <Button type="button" variant="secondary" leadingIcon={RiDeleteBin6Line} onClick={() => setRemoving(true)}>Remove {label} version</Button>
              )}
              {!saved && <Button type="button" variant="secondary" onClick={() => { setAdding(false); setDraft(EMPTY); }}>Cancel</Button>}
            </div>
            <Button type="submit" variant="primary" leadingIcon={RiSave3Line} disabled={!changed || busy || !draft.title.trim()}>
              {busy ? "Saving…" : `Save ${label}`}
            </Button>
          </div>
        )}
      </form>
      <AlertDialog isOpen={removing} onOpenChange={(o) => !o && setRemoving(false)} title={`Remove the ${label} version?`}
        description={`Visitors who choose ${label} will see the English text instead.`} confirmLabel="Remove" pendingLabel="Removing…"
        onConfirm={async () => {
          try {
            await adminApi.remove(cfg.textResource, String(saved!.id));
            toast(`${label} version removed`, { status: "success" });
            onSaved();
          } catch (e: any) { toast(e.message || "Couldn't remove it", { status: "error" }); throw e; }
        }} />
    </Card>
  );
}

/** A destination's photo gallery, activities and questions, each saved as you add it. */
function DestinationExtras({ id, onSaved }: { id: string; onSaved: () => void }) {
  return (
    <>
      <PhotosCard resource="destinations" id={id} onSaved={onSaved} />
      <RelatedList resource="destination-media" parentField="destination" parentId={id} title="Photo gallery" addLabel="Add photo"
        hint="Extra photos shown on the destination page. The main photo is the cover above." sortBy={["sort_order"]}
        primary={(r, sc) => <span className="flex items-center gap-3"><MediaThumb id={r.asset} className="h-14 w-20" /><span>{optionLabel(sc, "asset", r.asset)}</span></span>} />
      <RelatedList resource="destination-activities" parentField="destination" parentId={id} title="Things to do" addLabel="Add activity"
        primary={(r) => r.name} secondary={(r) => [r.name_te, r.name_hi].filter(Boolean).join(" · ") || null} />
      <RelatedList resource="faqs" parentField="destination" parentId={id} title="Questions visitors ask" addLabel="Add question"
        primary={(r) => r.question_en} secondary={(r) => r.answer_en} />
    </>
  );
}

/** Cover photo (saved straight away), category, tags and web address (saved with one button). */
function BlogSettingsCard({ post, onSaved }: { post: BlogPost; onSaved: () => void }) {
  const canEdit = post.permissions.edit;
  const [category, setCategory] = useState(post.category ? String(post.category) : "");
  const [tags, setTags] = useState<number[]>(post.tags);
  const [slug, setSlug] = useState(post.slug);
  const { busy, errors, general, submit } = useFormSubmit();

  // Follow the server only when these values themselves change there, so saving the text doesn't wipe unsaved choices here.
  const savedKey = `${post.category}|${post.tags.join(",")}|${post.slug}`;
  useEffect(() => { setCategory(post.category ? String(post.category) : ""); setTags(post.tags); setSlug(post.slug); }, [savedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const changed = category !== (post.category ? String(post.category) : "") || slug !== post.slug
    || tags.length !== post.tags.length || tags.some((t) => !post.tags.includes(t));

  async function saveCover(asset: string) {
    try {
      await adminApi.update("blogs", post.id, { cover: asset || null });
      toast(asset ? "Photo saved" : "Photo removed", { status: "success" });
      onSaved();
    } catch (e: any) { toast(e.message || "Couldn't save the photo", { status: "error" }); }
  }

  const save = () => submit(async () => {
    await adminApi.update("blogs", post.id, { category: category ? Number(category) : null, tags, ...(post.slug_locked ? {} : { slug: slug.trim() }) });
    toast("Saved", { status: "success" });
    onSaved();
  });

  return (
    <Card title="Post settings">
      <div className="flex flex-col gap-4">
        {canEdit
          ? <ImageUpload label="Cover photo" value={post.cover ?? ""} onChange={saveCover} hint="Shown on the blog list and at the top of the post. Saves straight away." />
          : post.cover_url && /* eslint-disable-next-line @next/next/no-img-element */ <img src={post.cover_url} alt="Cover" className="aspect-[16/9] w-full rounded-lg object-cover" />}

        <Select label="Category" selectedKey={category} onSelectionChange={(k) => setCategory(String(k ?? ""))} isDisabled={!canEdit} popoverClassName="min-w-56">
          {[{ id: "", name: "No category" }, ...post.options.categories].map((c) => <SelectItem key={c.id || "__none"} id={String(c.id)} textValue={c.name}>{c.name}</SelectItem>)}
        </Select>
        {post.options.categories.length === 0 && <p className="-mt-2 text-caption-1-medium text-text-tertiary">No categories yet. Add them under All data → Blog categories.</p>}

        <div className="flex flex-col gap-2">
          <span className="text-body-medium text-text-secondary">Tags</span>
          {post.options.tags.length === 0
            ? <p className="text-body-regular text-text-tertiary">No tags yet. Add them under All data → Blog tags.</p>
            : (
              <div className="flex max-h-48 flex-col gap-2 overflow-y-auto rounded-xl border border-border-button-default p-3">
                {post.options.tags.map((t) => (
                  <Checkbox key={t.id} isDisabled={!canEdit} isSelected={tags.includes(t.id)}
                    onChange={(on) => setTags((cur) => (on ? [...cur, t.id] : cur.filter((x) => x !== t.id)))}>{t.name}</Checkbox>
                ))}
              </div>
            )}
        </div>

        <Input label="Web address" value={slug} onChange={(v) => setSlug(v.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))}
          isReadOnly={!canEdit || post.slug_locked} isInvalid={!!errors.slug} errorMessage={errors.slug}
          hint={post.slug_locked ? `/blogs/${post.slug}. Fixed now that the post has been published.` : `/blogs/${slug || "…"}`} />

        {general && <p role="alert" className="text-body-regular text-text-error-primary">{general}</p>}
        {canEdit && <Button variant="primary" leadingIcon={RiSave3Line} disabled={!changed || busy || !slug.trim()} onClick={save}>{busy ? "Saving…" : "Save settings"}</Button>}
      </div>
    </Card>
  );
}
