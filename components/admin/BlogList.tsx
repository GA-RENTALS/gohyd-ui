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
import { adminApi, type BlogCard } from "@/lib/admin/api";

const LANG_LABEL = { en: "English", te: "Telugu", hi: "Hindi" } as const;
const day = (v: string) => new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** Blog posts as cards. "Add blog post" asks for a title only, then opens the new post's page. */
export function BlogList() {
  const router = useRouter();
  const [items, setItems] = useState<BlogCard[] | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      adminApi.blogs(search).then((d) => { setItems(d.results); setCanCreate(d.can_create); setErr(""); }).catch((e) => setErr(e.message));
    }, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [search]);

  // "New blog post" links elsewhere in the admin can open the form straight away with ?new=1
  useEffect(() => { if (new URLSearchParams(window.location.search).get("new") === "1") setAdding(true); }, []);

  return (
    <>
      <PageTitle title="Blog posts" sub="Stories and guides on the website's Journal. Click a post to write and publish it."
        actions={canCreate ? <Button variant="primary" leadingIcon={RiAddLine} onClick={() => setAdding(true)}>Add blog post</Button> : null} />

      <InputBase aria-label="Search blog posts" placeholder="Search blog posts" leadingIcon={RiSearchLine} value={search}
        onChange={(e) => setSearch(e.target.value)}
        fieldClassName="mb-5 w-full rounded-lg border border-border-button-default bg-background-primary-default sm:w-[320px]" className="text-body-medium" />

      {err && <p className="py-10 text-center text-body-medium text-text-error-primary">{err}</p>}
      {!items && !err && <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div>}
      {items?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border-button-default py-16 text-center">
          <p className="text-body-medium text-text-primary">{search ? `No posts match “${search}”.` : "No blog posts yet."}</p>
          {canCreate && !search && <Button className="mt-3" variant="primary" leadingIcon={RiAddLine} onClick={() => setAdding(true)}>Write your first post</Button>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items?.map((b) => {
          const live = b.status === "PUBLISHED";
          const missing = (["te", "hi"] as const).filter((l) => !b.languages.includes(l)).map((l) => LANG_LABEL[l]);
          return (
            <Link key={b.id} href={`/admin/overview/blog/${b.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border-button-default bg-background-primary-default transition-shadow hover:shadow-md">
              <div className="relative aspect-[16/8] bg-background-secondary-default">
                {b.cover_url
                  ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={b.cover_url} alt="" className="size-full object-cover" />
                  : <div className="grid size-full place-items-center text-foreground-icon-tertiary"><RiArticleLine className="size-8" aria-hidden /></div>}
                <div className="absolute start-3 top-3">
                  <StatusPill status={b.status} tone={live ? "green" : "amber"} label={live ? "Live" : b.status === "SCHEDULED" ? "Scheduled" : "Draft"} />
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h2 className="text-headline-medium text-text-primary group-hover:underline">{b.title}</h2>
                {b.summary && <p className="line-clamp-2 text-body-regular text-text-secondary">{b.summary}</p>}
                <p className="mt-auto border-t border-separator-border pt-3 text-caption-1-medium text-text-tertiary">
                  {[b.category, live && b.published_at ? `Published ${day(b.published_at)}` : `Edited ${day(b.updated_at)}`, b.author].filter(Boolean).join(" · ")}
                  {missing.length > 0 && <span className="block">{missing.join(" & ")} not added</span>}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {adding && <AddBlogModal onClose={() => setAdding(false)} onCreated={(id) => router.push(`/admin/overview/blog/${id}`)} />}
    </>
  );
}

function AddBlogModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [title, setTitle] = useState("");
  const { busy, errors, general, submit } = useFormSubmit();
  const save = async () => {
    let id = "";
    if (await submit(async () => { id = (await adminApi.createBlog(title.trim())).id; })) onCreated(id);
  };
  return (
    <FormModal title="Add blog post" description="Start with the title. You'll write the post, add a photo and publish it on the next page."
      submitLabel="Create post" busy={busy} general={general} canSubmit={!!title.trim()} onSubmit={save} onClose={onClose}>
      <Input label="Title (English) *" value={title} onChange={setTitle} autoFocus maxLength={255}
        isInvalid={!!errors.title} errorMessage={errors.title} hint="The web address is made from this. You can change it until the post is published." />
    </FormModal>
  );
}
