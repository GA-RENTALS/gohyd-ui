"use client";
import { use } from "react";
import { ContentEditor } from "@/components/admin/ContentEditor";

export default function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ContentEditor kind="blogs" id={id} />;
}
