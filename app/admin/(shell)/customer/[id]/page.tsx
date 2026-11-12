"use client";
import { use } from "react";
import { CustomerPage } from "@/components/admin/CustomerPage";

export default function Customer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <CustomerPage id={id} />;
}
