"use client";
import { use } from "react";
import { BlogList } from "@/components/admin/BlogList";
import { Catalog } from "@/components/admin/Catalog";
import { ResourceView } from "@/components/admin/ResourceView";

export default function ResourcePage({ params }: { params: Promise<{ module: string; resource: string }> }) {
  const { module, resource } = use(params);
  // Trips, events and blog posts get their own card list; each card opens one page with everything about it.
  if (module === "trips" && resource === "trips") return <Catalog kind="trip" />;
  if (module === "events" && resource === "events") return <Catalog kind="event" />;
  if (module === "cms" && resource === "blogs") return <BlogList />;
  return <ResourceView moduleKey={module} resourceKey={resource} />;
}
