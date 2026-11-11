import { serverT } from "@/lib/lang-server";
import type { Metadata } from "next";
import Link from "next/link";
import { listBlogs } from "@/lib/customer/public-content";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({ title: "Stories from Hyderabad", description: "Guides, ideas and stories for your next Hyderabad weekend.", path: "/blogs" });
export const dynamic = "force-dynamic";

export default async function BlogsPage() {
  const t = await serverT();
  let blogs = [] as Awaited<ReturnType<typeof listBlogs>>;
  let failed = false;
  try { blogs = await listBlogs(); } catch { failed = true; }
  return (
    <div className="wrap">
      <div className="eyebrow">{t("Notes from the city")}</div>
      <h1 className="bk-title">{t("h.blog.1")} <em>{t("h.blog.2")}</em></h1>
      <p className="bk-lede">{t("Ideas for seeing more of Hyderabad and making a weekend of it.")}</p>
      {failed ? <p className="bk-error" role="alert">{t("Stories are unavailable right now. Please try again in a moment.")}</p> : blogs.length === 0 ? (
        <div className="bk-empty"><p>{t("Stories are on the way.")}</p><p><Link href="/destinations">{t("Explore places meanwhile")}</Link></p></div>
      ) : (
        <div className="bk-grid">
          {blogs.map((blog) => (
            <Link className="bk-trip" key={blog.id} href={`/blogs/${blog.slug}`}>
              <div className="bk-cover" aria-hidden="true" />
              <div className="bk-body"><div className="eyebrow">{blog.published_at ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(blog.published_at)) : t("GoHyderabad journal")}</div><h2>{blog.title}</h2>{blog.summary && <p>{blog.summary}</p>}<div className="bk-meta"><span>{t("Read story")}</span><span>↗</span></div></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
