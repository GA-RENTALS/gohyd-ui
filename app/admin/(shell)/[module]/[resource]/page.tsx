"use client";
import { use } from "react";
import { ResourceView } from "@/components/admin/ResourceView";

export default function ResourcePage({ params }: { params: Promise<{ module: string; resource: string }> }) {
  const { module, resource } = use(params);
  return <ResourceView moduleKey={module} resourceKey={resource} />;
}
