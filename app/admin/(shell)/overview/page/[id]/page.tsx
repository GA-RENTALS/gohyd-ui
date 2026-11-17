"use client";
import { use } from "react";
import { ContentEditor } from "@/components/admin/ContentEditor";

export default function WebsitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ContentEditor kind="pages" id={id} />;
}
