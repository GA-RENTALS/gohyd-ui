"use client";
import { RiArrowRightSLine, RiSearchLine } from "@remixicon/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader, useAdmin } from "@/components/admin/Shell";
import { InputBase } from "@/components/base/input/input";
import { CORE_RESOURCES } from "@/lib/admin/nav";

/** Every table the staff member can open that doesn't have its own sidebar item, grouped by area. One click opens it. */
export default function AllData() {
  const { modules } = useAdmin();
  const [q, setQ] = useState("");
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return modules
      .map((m) => ({
        ...m,
        resources: m.resources.filter((r) => !CORE_RESOURCES.has(r.key) && (!needle || `${m.label} ${r.label}`.toLowerCase().includes(needle))),
      }))
      .filter((m) => m.resources.length);
  }, [modules, q]);

  return (
    <>
      <PageHeader crumbs={["All data"]} title="All data" />
      <p className="mb-4 max-w-2xl text-body-regular text-text-secondary">
        Everyday screens are in the sidebar. Everything else (schedules, itineraries, translations, logistics, content, finance details and logs) is here.
      </p>
      <InputBase
        aria-label="Find a table" placeholder="Find a table, e.g. schedules" leadingIcon={RiSearchLine} value={q}
        onChange={(e) => setQ(e.target.value)}
        fieldClassName="mb-5 w-full rounded-lg border border-border-button-default bg-background-primary-default sm:w-[320px]" className="text-body-medium"
      />
      {groups.length === 0 && <p className="py-10 text-center text-body-medium text-text-tertiary">No tables match “{q}”.</p>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((m) => (
          <section key={m.key} className="rounded-xl border border-border-button-default bg-background-primary-default p-3">
            <h2 className="mb-2 px-2 text-headline-medium text-text-primary">{m.label}</h2>
            <ul className="flex flex-col">
              {m.resources.map((r) => (
                <li key={r.key}>
                  <Link href={`/admin/${m.key}/${r.key}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-body-medium text-text-secondary hover:bg-background-secondary-default hover:text-text-primary">
                    <span className="truncate">{r.label}</span>
                    <RiArrowRightSLine className="size-4 shrink-0" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
