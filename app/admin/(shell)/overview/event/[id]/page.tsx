"use client";
import { use } from "react";
import { OverviewPage } from "@/components/admin/Overview";

export default function EventOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <OverviewPage kind="event" id={id} />;
}
