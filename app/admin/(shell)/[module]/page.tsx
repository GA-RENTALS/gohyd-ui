"use client";
import { useRouter } from "next/navigation";
import { use, useEffect } from "react";
import { useAdmin } from "@/components/admin/Shell";

export default function ModuleIndex({ params }: { params: Promise<{ module: string }> }) {
  const { module } = use(params);
  const { modules } = useAdmin();
  const router = useRouter();
  const first = modules.find((m) => m.key === module)?.resources[0];
  useEffect(() => { if (first) router.replace(`/admin/${module}/${first.key}`); }, [first, module, router]);
  return first ? null : <p className="text-muted">You don't have access to this module.</p>;
}
