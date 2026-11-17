import { serverT } from "@/lib/lang-server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlog, type PublicBlog } from "@/lib/customer/public-content";
import { metaDescription, pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const blog = await getBlog(slug);
    if (blog) return pageMetadata({
      title: blog.seo?.title || blog.title,
      description: metaDescription(blog.seo?.description, blog.summary, blog.body),
      path: `/blogs/${encodeURIComponent(slug)}`,
      image: blog.cover_url,
      imageAlt: blog.title,
      type: "article",
    });
  } catch {}
  return pageMetadata({ title: "GoHyderabad story", path: `/blogs/${encodeURIComponent(slug)}`, type: "article" });
}

export default async function BlogDetailPage({ params }: Props) {
  const t = await serverT();
  const { slug } = await params;
  let blog: PublicBlog | null = null;
  let failed = false;
  try { blog = await getBlog(slug); } catch { failed = true; }
  if (!blog && !failed) notFound();
  if (failed) return <div className="wrap"><p className="bk-error" role="alert">This story is temporarily unavailable. Please try again in a moment.</p></div>;
  if (!blog) notFound();
  return (
    <article className="wrap bk-narrow">
      <div className="eyebrow"><Link href="/blogs">{t("GoHyderabad journal")}</Link>{blog.category && <> · {blog.category.name}</>}</div>
      <h1 className="bk-title">{blog.title}</h1>
      {blog.published_at && <p className="bk-note">{new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date(blog.published_at))}</p>}
      {blog.cover_url && <img className="bk-hero-img" src={blog.cover_url} alt="" style={{ margin: "18px 0" }} />}
      {blog.summary && <p className="bk-lede">{blog.summary}</p>}
      {/* The API allows only headings, paragraphs, lists, quotes and links, and cleans the HTML on save and again on the
          way out (gohyd-api content/html.py), so it is safe to render as markup. */}
      {blog.body && <div className="bk-card bk-prose bk-rich" dangerouslySetInnerHTML={{ __html: blog.body }} />}
      {blog.tags?.length > 0 && <div className="bk-chips">{blog.tags.map((tag) => <span key={tag.slug} className="bk-chip">{tag.name}</span>)}</div>}
      <p style={{ marginTop: 24 }}><Link href="/blogs">{t("← All stories")}</Link></p>
    </article>
  );
}
