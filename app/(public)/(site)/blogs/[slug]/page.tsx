import { serverT } from "@/lib/lang-server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { contentText, getBlog, type PublicBlog } from "@/lib/customer/public-content";
import { metaDescription, pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const blog = await getBlog(slug);
    if (blog) return pageMetadata({ title: blog.title, description: metaDescription(blog.summary, blog.body), path: `/blogs/${encodeURIComponent(slug)}`, type: "article" });
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
      <div className="eyebrow"><Link href="/blogs">{t("GoHyderabad journal")}</Link></div>
      <h1 className="bk-title">{blog.title}</h1>
      {blog.published_at && <p className="bk-note">{new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date(blog.published_at))}</p>}
      {blog.summary && <p className="bk-lede">{blog.summary}</p>}
      {blog.body && <div className="bk-card bk-prose">{contentText(blog.body)}</div>}
      <p style={{ marginTop: 24 }}><Link href="/blogs">{t("← All stories")}</Link></p>
    </article>
  );
}
