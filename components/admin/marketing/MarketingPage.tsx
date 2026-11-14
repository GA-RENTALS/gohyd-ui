"use client";
/**
 * Marketing: coupons, campaigns (with tracked links and cost per booking), newsletter subscribers and referrals.
 * Lists: GET /admin/marketing/<tab>/ (admin_api/marketing.py). Creating and editing go through the resources API.
 */
import { RiAddLine } from "@remixicon/react";
import { useState } from "react";
import { listQuery, useList, useQueryState } from "@/components/admin/hooks";
import { Card, ExportButton, FilterPills, money, PageTitle, Pager, SearchBox, StatTile } from "@/components/admin/ui";
import { Button } from "@/components/base/buttons/button";
import { adminApi, type MarketingSummary, type MarketingTab } from "@/lib/admin/api";
import { CampaignsTab } from "./CampaignsTab";
import { CouponsTab } from "./CouponsTab";
import { ReferralsTab, SubscribersTab } from "./AudienceTabs";

const TABS: Record<MarketingTab, { label: string; statuses: { key: string; label: string }[]; search: string; newLabel?: string }> = {
  coupons: { label: "Coupons", search: "Code…", newLabel: "New coupon",
    statuses: [{ key: "active", label: "Live" }, { key: "scheduled", label: "Starts later" }, { key: "ended", label: "Ended" }, { key: "paused", label: "Paused" }] },
  campaigns: { label: "Campaigns", search: "Name or tag…", newLabel: "New campaign",
    statuses: [{ key: "running", label: "Running" }, { key: "other", label: "Not running" }] },
  subscribers: { label: "Subscribers", search: "Email…",
    statuses: [{ key: "subscribed", label: "Subscribed" }, { key: "unsubscribed", label: "Unsubscribed" }] },
  referrals: { label: "Referrals", search: "Campaign…", newLabel: "New referral campaign",
    statuses: [{ key: "active", label: "On" }, { key: "paused", label: "Off" }] },
};

export function MarketingPage() {
  const [f, setF] = useQueryState({ tab: "coupons", status: "all" });
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const tab = (f.tab in TABS ? f.tab : "coupons") as MarketingTab;
  const { data, loading, page, setPage, reload, search: settledSearch } =
    useList((qs) => adminApi.marketing<any>(tab, qs), { tab, status: f.status }, search);

  const config = TABS[tab];
  const can = data?.can ?? { create: false, update: false, tabs: [] as MarketingTab[] };
  const visibleTabs = (data ? can.tabs : (Object.keys(TABS) as MarketingTab[])).map((key) => ({ key, label: TABS[key].label }));
  const tabProps = { rows: data?.results ?? null, loading, can, onChanged: reload, creating, onCloseCreate: () => setCreating(false) };

  return (
    <>
      <PageTitle title="Marketing" sub="Coupons, campaigns and the people who follow you."
        actions={<>
          <ExportButton onExport={() => adminApi.exportCsv(`/admin/marketing/${tab}/`, listQuery({ status: f.status }, undefined, settledSearch), `${tab}.csv`)} />
          {config.newLabel && can.create && <Button variant="primary" leadingIcon={RiAddLine} onClick={() => setCreating(true)}>{config.newLabel}</Button>}
        </>} />

      {data?.summary && <SummaryStrip summary={data.summary} onOpen={(t) => { setF({ tab: t, status: "all" }); setSearch(""); }} />}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <FilterPills value={tab} onChange={(t) => { setF({ tab: t, status: "all" }); setSearch(""); setCreating(false); }} options={visibleTabs} />
        <div className="flex-1" />
        <SearchBox value={search} onChange={setSearch} placeholder={config.search} />
      </div>

      <Card pad={false}>
        <div className="border-b border-separator-border p-3">
          <FilterPills value={f.status} onChange={(status) => setF({ status })}
            options={[{ key: "all", label: "All", count: data?.counts?.all }, ...config.statuses.map((s) => ({ ...s, count: data?.counts?.[s.key] }))]} />
        </div>
        {tab === "coupons" && <CouponsTab {...tabProps} />}
        {tab === "campaigns" && <CampaignsTab {...tabProps} />}
        {tab === "subscribers" && <SubscribersTab {...tabProps} />}
        {tab === "referrals" && <ReferralsTab {...tabProps} />}
        {data && <Pager page={page} pages={data.pages} count={data.count} onChange={setPage} />}
      </Card>
    </>
  );
}

function SummaryStrip({ summary: s, onOpen }: { summary: MarketingSummary; onOpen: (tab: MarketingTab) => void }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {s.coupons && <StatTile label="Live coupons" value={s.coupons.live} sub={`${s.coupons.uses_month} used this month · ${money(s.coupons.discount_month)} off`} onClick={() => onOpen("coupons")} />}
      {s.campaigns && <StatTile label="Running campaigns" value={s.campaigns.running} sub={`${money(s.campaigns.spend_month)} spent this month`} onClick={() => onOpen("campaigns")} />}
      {s.subscribers && <StatTile label="Subscribers" value={s.subscribers.total.toLocaleString("en-IN")} sub={`${s.subscribers.new_month} new this month`} onClick={() => onOpen("subscribers")} />}
      {s.referrals && <StatTile label="Referrals this month" value={s.referrals.month} tone={s.referrals.unrewarded ? "amber" : undefined}
        sub={s.referrals.unrewarded ? `${s.referrals.unrewarded} waiting for a reward` : "All rewarded"} onClick={() => onOpen("referrals")} />}
    </div>
  );
}
