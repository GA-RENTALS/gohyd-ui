"use client";
import { use } from "react";
import { Catalog } from "@/components/admin/Catalog";
import { ResourceView } from "@/components/admin/ResourceView";

export default function ResourcePage({ params }: { params: Promise<{ module: string; resource: string }> }) {
  const { module, resource } = use(params);
  // Trips and events get their own card list; each card opens one page with everything about it.
  if (module === "trips" && resource === "trips") return <Catalog kind="trip" />;
  if (module === "events" && resource === "events") return <Catalog kind="event" />;
  return <ResourceView moduleKey={module} resourceKey={resource} />;
}
