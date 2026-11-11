import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicEnquiryForm } from "@/components/site/PublicEnquiryForm";
import { contentText, getCmsPage, listFaqs, type PublicPage } from "@/lib/customer/public-content";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
const knownSlugs = new Set(["about", "how-it-works", "faqs", "contact", "corporate", "community", "membership"]);
const titles: Record<string, string> = {
  about: "About GoHyderabad",
  "how-it-works": "How it works",
  faqs: "Frequently asked questions",
  contact: "Contact GoHyderabad",
  corporate: "Corporate outings",
  community: "GoHyderabad community",
  membership: "GoHyderabad membership",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!knownSlugs.has(slug)) return pageMetadata({ title: "Page not found", path: `/${encodeURIComponent(slug)}`, noindex: true });
  let page: PublicPage | null = null;
  try { page = await getCmsPage(slug); } catch {}
  return pageMetadata({ title: page?.title || titles[slug], description: page?.body ? page.body : undefined, path: `/${slug}` });
}

export default async function PublicContentPage({ params }: Props) {
  const { slug } = await params;
  if (!knownSlugs.has(slug)) notFound();
  let page: PublicPage | null = null;
  let pageFailed = false;
  try { page = await getCmsPage(slug); } catch { pageFailed = true; }
  let faqs: Awaited<ReturnType<typeof listFaqs>> = [];
  let faqFailed = false;
  if (slug === "faqs") {
    try { faqs = await listFaqs(); } catch { faqFailed = true; }
  }

  const title = page?.title || titles[slug];
  const isEnquiry = slug === "contact" || slug === "corporate" || slug === "membership";
  return (
    <div className="wrap">
      <div className="eyebrow">GoHyderabad · Meet · Explore · Experience</div>
      <h1 className="bk-title">{title}</h1>
      <div className={isEnquiry ? "bk-detail" : "bk-narrow"}>
        <div className="bk-detail-content">
          {page?.body ? <div className="bk-card bk-prose">{contentText(page.body)}</div> : null}
          {pageFailed && <p className="bk-note">Some page details are temporarily unavailable.</p>}
          {slug === "about" && !page?.body && <div className="bk-card bk-prose">GoHyderabad brings people together through local experiences, city explorations and trips from Hyderabad. Find a plan that sounds like your kind of weekend and come along.</div>}
          {slug === "how-it-works" && !page?.body && <div className="bk-card"><h2>Choose a plan and book</h2><p className="bk-prose">Browse a trip or experience, check its details and available dates, then follow the booking steps. Your account keeps your booking details and payment balance in one place.</p><p><Link className="btn" href="/trips">Browse trips</Link></p></div>}
          {slug === "faqs" && (faqFailed ? <p className="bk-error" role="alert">FAQs are unavailable right now.</p> : faqs.length ? <div className="bk-card"><h2>Common questions</h2>{faqs.map((faq) => <details className="bk-more" key={faq.id}><summary>{faq.question}</summary><p className="bk-prose">{faq.answer}</p></details>)}</div> : !page?.body ? <div className="bk-card bk-prose">Questions about a particular trip are answered on that trip's detail page. For anything else, <Link href="/contact">send us a message</Link>.</div> : null)}
          {slug === "community" && !page?.body && <div className="bk-card bk-prose"><p>GoHyderabad is for people who want to explore the city and nearby places together. Browse the next plans, meet the group at an event, and keep up with announcements on Instagram.</p><p><Link href="/experiences">See experiences</Link> · <a href="https://www.instagram.com/gohyderabad/" target="_blank" rel="noopener noreferrer">Follow GoHyderabad on Instagram ↗</a></p></div>}
          {slug === "membership" && !page?.body && <div className="bk-card bk-prose"><p>Interested in a GoHyderabad membership? Leave your details and the team can share the current membership information with you.</p></div>}
          {slug === "corporate" && !page?.body && <div className="bk-card bk-prose"><p>Planning a team outing in or around Hyderabad? Tell us about your group, preferred dates and the kind of day you have in mind.</p></div>}
          {slug === "contact" && !page?.body && <div className="bk-card bk-prose"><p>Have a question about a trip, event or booking? Send a message and the GoHyderabad team will get back to you.</p></div>}
        </div>
        {slug === "contact" && <PublicEnquiryForm kind="contact" />}
        {slug === "corporate" && <PublicEnquiryForm kind="corporate" />}
        {slug === "membership" && <PublicEnquiryForm kind="contact" />}
      </div>
    </div>
  );
}
