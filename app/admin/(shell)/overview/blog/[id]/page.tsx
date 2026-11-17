"use client";
import { use } from "react";
import { BlogEditor } from "@/components/admin/BlogEditor";

export default function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <BlogEditor id={id} />;
}
