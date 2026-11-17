"use client";
import { useState } from "react";
import { ResourceView } from "@/components/admin/ResourceView";
import { FilterPills } from "@/components/admin/ui";
import { useAdmin } from "@/components/admin/Shell";

export function EnquiriesPage() {
  const { modules } = useAdmin();
  const [kind, setKind] = useState("enquiries");
  const canSeeCorporate = Boolean(modules.find((module) => module.key === "crm")?.resources.some((resource) => resource.key === "corporate-enquiries"));
  return <>
    {canSeeCorporate && <div className="mb-4"><FilterPills value={kind} onChange={setKind} options={[
      { key: "enquiries", label: "Website enquiries" }, { key: "corporate-enquiries", label: "Corporate enquiries" },
    ]} /></div>}
    <ResourceView moduleKey="crm" resourceKey={kind} />
  </>;
}
