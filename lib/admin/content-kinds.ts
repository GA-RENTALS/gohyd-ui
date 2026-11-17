import type { ContentKind } from "./api";

/**
 * Blog posts, website pages and destinations share one list and one editor (components/admin/ContentList.tsx,
 * ContentEditor.tsx). This is what differs between them: names, addresses and the resources each one saves to.
 */
export type ContentKindConfig = {
  /** Plural, for the list title and the breadcrumb. */
  title: string;
  /** Singular, lower case: "blog post". */
  singular: string;
  listSub: string;
  listHref: string;
  /** Where one item's editor lives. */
  itemHref: (id: string) => string;
  /** Generic resource for the item's own fields, and for each language's text (`{ ...text, [parentField]: id }`). */
  resource: string;
  textResource: string;
  parentField: string;
  bodyLabel: string;
  bodyHint: string;
  summaryHint: string;
  addHint: string;
};

export const CONTENT_KINDS: Record<ContentKind, ContentKindConfig> = {
  blogs: {
    title: "Blog posts", singular: "blog post",
    listSub: "Stories and guides on the website's Journal. Click a post to write and publish it.",
    listHref: "/admin/cms/blogs", itemHref: (id) => `/admin/overview/blog/${id}`,
    resource: "blogs", textResource: "blog-translations", parentField: "blog",
    bodyLabel: "Post", bodyHint: "Use Heading for sections. Pasted text loses its outside formatting; format it here.",
    summaryHint: "One or two sentences. Shown on the blog list and under the title.",
    addHint: "Start with the title. You'll write the post, add a photo and publish it on the next page.",
  },
  pages: {
    title: "Website pages", singular: "page",
    listSub: "About, policies and other pages with their own address. Click a page to edit and publish it.",
    listHref: "/admin/cms/cms-pages", itemHref: (id) => `/admin/overview/page/${id}`,
    resource: "cms-pages", textResource: "cms-translations", parentField: "page",
    bodyLabel: "Page text", bodyHint: "Use Heading for sections. Pasted text loses its outside formatting; format it here.",
    summaryHint: "Optional. Used as the search-engine description when that is empty.",
    addHint: "Start with the title. You'll write the page and publish it on the next page.",
  },
  destinations: {
    title: "Destinations", singular: "destination",
    listSub: "Places on the website's Destinations and Explore pages. Click one to edit its text, photos and details.",
    listHref: "/admin/destinations/destinations", itemHref: (id) => `/admin/overview/destination/${id}`,
    resource: "destinations", textResource: "destination-translations", parentField: "destination",
    bodyLabel: "Description", bodyHint: "What to see and do, how to get there, the best time to go.",
    summaryHint: "One or two sentences. Shown on the destination cards.",
    addHint: "Start with the name. You'll add the description, photos, map position and activities on the next page.",
  },
};

/**
 * Pages the website links to at a fixed address. "Add" offers the missing ones with the address already set, so the
 * footer and checkout links work as soon as they are published (gohyd-ui app/(public)/(site)/[slug]/page.tsx).
 */
export const SUGGESTED_PAGES: { slug: string; title: string }[] = [
  { slug: "privacy", title: "Privacy policy" },
  { slug: "terms", title: "Terms and conditions" },
  { slug: "refund-policy", title: "Cancellation and refund policy" },
  { slug: "about", title: "About GoHyderabad" },
  { slug: "how-it-works", title: "How it works" },
];
