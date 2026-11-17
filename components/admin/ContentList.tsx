"use client";
import { RiAddLine, RiArticleLine, RiSearchLine } from "@remixicon/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormModal, useFormSubmit } from "@/components/admin/FormModal";
import { PageTitle, StatusPill } from "@/components/admin/ui";
import { Button } from "@/components/base/buttons/button";
import { Input, InputBase } from "@/components/base/input/input";
import { Skeleton } from "@/components/base/skeleton/skeleton";
import { adminApi, type ContentCard, type ContentKind } from "@/lib/admin/api";
import { CONTENT_KINDS, SUGGESTED_PAGES } from "@/lib/admin/content-kinds";

const LANG_LABEL = { en: "English", te: "Telugu", hi: "Hindi" } as const;
const day = (v: string) => new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** Blog posts, website pages or destinations as cards. "Add" asks for a title only, then opens the new item's editor. */
export function ContentList({ kind }: { kind: ContentKind }) {
  const cfg = CONTENT_KINDS[kind];
  const router = useRouter();
  const [items, setItems] = useState<ContentCard[] | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  const [existing, setExisting] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<{ title: string; slug: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      adminApi.content(kind, search)
        .then((d) => { setItems(d.results); setCanCreate(d.can_create); setExisting(d.existing_slugs); setErr(""); })
        .catch((e) => setErr(e.message));
    }, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [kind, search]);

  // "New …" links elsewhere in the admin can open the form straight away with ?new=1
  useEffect(() => { if (new URLSearchParams(window.location.search).get("new") === "1") setAdding({ title: "", slug: "" }); }, []);

  const missingPages = kind === "pages" ? SUGGESTED_PAGES.filter((p) => !existing.includes(p.slug)) : [];
  const addLabel = `Add ${cfg.singular}`;

  return (
    <>
      <PageTitle title={cfg.title} sub={cfg.listSub}
        actions={canCreate ? <Button variant="primary" leadingIcon={RiAddLine} onClick={() => setAdding({ title: "", slug: "" })}>{addLabel}</Button> : null} />

      {canCreate && missingPages.length > 0 && !search && (
        <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/40">
          <p className="text-body-medium text-text-primary">These pages show built-in text on the website. Add one here to replace it with your own wording:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {missingPages.map((p) => (
              <Button key={p.slug} size="small" variant="secondary" leadingIcon={RiAddLine} onClick={() => setAdding(p)}>{p.title}</Button>
            ))}
          </div>
        </div>
      )}

      <InputBase aria-label={`Search ${cfg.title.toLowerCase()}`} placeholder={`Search ${cfg.title.toLowerCase()}`} leadingIcon={RiSearchLine} value={search}
        onChange={(e) => setSearch(e.target.value)}
        fieldClassName="mb-5 w-full rounded-lg border border-border-button-default bg-background-primary-default sm:w-[320px]" className="text-body-medium" />

      {err && <p className="py-10 text-center text-body-medium text-text-error-primary">{err}</p>}
      {!items && !err && <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div>}
      {items?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border-button-default py-16 text-center">
          <p className="text-body-medium text-text-primary">{search ? `Nothing matches “${search}”.` : `No ${cfg.title.toLowerCase()} yet.`}</p>
          {canCreate && !search && <Button className="mt-3" variant="primary" leadingIcon={RiAddLine} onClick={() => setAdding({ title: "", slug: "" })}>{addLabel}</Button>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items?.map((b) => {
          const live = b.status === "PUBLISHED";
          const missing = (["te", "hi"] as const).filter((l) => !b.languages.includes(l)).map((l) => LANG_LABEL[l]);
          return (
            <Link key={b.id} href={cfg.itemHref(b.id)}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border-button-default bg-background-primary-default transition-shadow hover:shadow-md">
              {kind !== "pages" && (
                <div className="relative aspect-[16/8] bg-background-secondary-default">
                  {b.cover_url
                    ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={b.cover_url} alt="" className="size-full object-cover" />
                    : <div className="grid size-full place-items-center text-foreground-icon-tertiary"><RiArticleLine className="size-8" aria-hidden /></div>}
                </div>
              )}
              <div className="flex flex-1 flex-col gap-2 p-4">
                <StatusPill status={b.status} tone={live ? "green" : b.status === "SCHEDULED" ? "blue" : "amber"}
                  label={live ? "Live" : b.status === "SCHEDULED" ? "Scheduled" : "Draft"} />
                <h2 className="text-headline-medium text-text-primary group-hover:underline">{b.title}</h2>
                {b.summary && <p className="line-clamp-2 text-body-regular text-text-secondary">{b.summary}</p>}
                <p className="mt-auto border-t border-separator-border pt-3 text-caption-1-medium text-text-tertiary">
                  {[b.subtitle, live && b.published_at ? `Published ${day(b.published_at)}` : `Edited ${day(b.updated_at)}`].filter(Boolean).join(" · ")}
                  {missing.length > 0 && <span className="block">{missing.join(" & ")} not added</span>}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {adding && <AddModal kind={kind} initial={adding} onClose={() => setAdding(null)} onCreated={(id) => router.push(cfg.itemHref(id))} />}
    </>
  );
}

function AddModal({ kind, initial, onClose, onCreated }: {
  kind: ContentKind; initial: { title: string; slug: string }; onClose: () => void; onCreated: (id: string) => void;
}) {
  const cfg = CONTENT_KINDS[kind];
  const [title, setTitle] = useState(initial.title);
  const { busy, errors, general, submit } = useFormSubmit();
  const save = async () => {
    let id = "";
    if (await submit(async () => { id = (await adminApi.createContent(kind, title.trim(), initial.slug || undefined)).id; })) onCreated(id);
  };
  const where = initial.slug ? `It will be at /${initial.slug}, where the website already links.` : "The web address is made from this. You can change it until it is published.";
  return (
    <FormModal title={`Add ${cfg.singular}`} description={cfg.addHint}
      submitLabel="Create" busy={busy} general={general} canSubmit={!!title.trim()} onSubmit={save} onClose={onClose}>
      <Input label={kind === "destinations" ? "Name (English) *" : "Title (English) *"} value={title} onChange={setTitle} autoFocus maxLength={255}
        isInvalid={!!(errors.title || errors.slug)} errorMessage={errors.title || errors.slug} hint={where} />
    </FormModal>
  );
}
