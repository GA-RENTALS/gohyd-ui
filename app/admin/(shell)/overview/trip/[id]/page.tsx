"use client";
import { use } from "react";
import { OverviewPage } from "@/components/admin/Overview";

export default function TripOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <OverviewPage kind="trip" id={id} />;
}
