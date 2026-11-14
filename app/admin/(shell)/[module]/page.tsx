"use client";
import { useRouter } from "next/navigation";
import { use, useEffect } from "react";
import { Catalog } from "@/components/admin/Catalog";
import { CustomersPage } from "@/components/admin/CustomersPage";
import { BookingsPage } from "@/components/admin/BookingsPage";
import { MarketingPage } from "@/components/admin/marketing/MarketingPage";
import { PaymentsPage } from "@/components/admin/PaymentsPage";
import { TeamPage } from "@/components/admin/TeamPage";
import { useAdmin } from "@/components/admin/Shell";

/** Short addresses for the everyday pages; any other module opens its first table. */
export default function ModuleIndex({ params }: { params: Promise<{ module: string }> }) {
  const { module } = use(params);
  const { modules } = useAdmin();
  const router = useRouter();
  const custom = ["trips", "events", "bookings", "payments", "customers", "marketing", "team"].includes(module);
  const first = modules.find((m) => m.key === module)?.resources[0];
  useEffect(() => { if (!custom && first) router.replace(`/admin/${module}/${first.key}`); }, [custom, first, module, router]);
  if (module === "trips") return <Catalog kind="trip" />;
  if (module === "events") return <Catalog kind="event" />;
  if (module === "bookings") return <BookingsPage />;
  if (module === "payments") return <PaymentsPage />;
  if (module === "customers") return <CustomersPage />;
  if (module === "marketing") return <MarketingPage />;
  if (module === "team") return <TeamPage />;
  return first ? null : <p className="text-text-secondary">You don't have access to this section.</p>;
}
