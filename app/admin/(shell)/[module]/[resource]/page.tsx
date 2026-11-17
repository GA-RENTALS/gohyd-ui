"use client";
import { use } from "react";
import { Catalog } from "@/components/admin/Catalog";
import { ContentList } from "@/components/admin/ContentList";
import { EnquiriesPage } from "@/components/admin/EnquiriesPage";
import { ResourceView } from "@/components/admin/ResourceView";

export default function ResourcePage({ params }: { params: Promise<{ module: string; resource: string }> }) {
  const { module, resource } = use(params);
  // Trips, events, blog posts, website pages and destinations get their own card list; each card opens one page with everything about it.
  if (module === "trips" && resource === "trips") return <Catalog kind="trip" />;
  if (module === "events" && resource === "events") return <Catalog kind="event" />;
  if (module === "cms" && resource === "blogs") return <ContentList kind="blogs" />;
  if (module === "cms" && resource === "cms-pages") return <ContentList kind="pages" />;
  if (module === "destinations" && resource === "destinations") return <ContentList kind="destinations" />;
  if (module === "crm" && resource === "enquiries") return <EnquiriesPage />;
  return <ResourceView moduleKey={module} resourceKey={resource} />;
}
