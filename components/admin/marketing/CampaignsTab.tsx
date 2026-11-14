"use client";
import { RiLinksLine } from "@remixicon/react";
import { useMemo, useState } from "react";
import { FormModal, useFormSubmit } from "@/components/admin/FormModal";
import { type Column, DataTable, dateOnly, Empty, money, StatusPill } from "@/components/admin/ui";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { adminApi, type CampaignRow } from "@/lib/admin/api";
import { SITE_URL } from "@/lib/site";
import { copyText, slugify, toDay, type TabProps } from "./shared";

export function CampaignsTab({ rows, loading, can, onChanged, creating, onCloseCreate }: TabProps<CampaignRow>) {
  const [costFor, setCostFor] = useState<CampaignRow | null>(null);
  const [linkFor, setLinkFor] = useState<CampaignRow | null>(null);

  const columns: Column<CampaignRow>[] = [
    { key: "name", label: "Campaign", render: (c) => (
      <span className="block min-w-0">
        <span className="block truncate text-body-medium">{c.name}</span>
        <span className="block truncate font-mono text-caption-1-medium text-text-tertiary">{c.utm_campaign ? `utm_campaign=${c.utm_campaign}` : "No UTM tag: results can't be tracked"}</span>
      </span>
    ) },
    { key: "dates", label: "Runs", hideOnMobile: true, render: (c) => <span className="whitespace-nowrap text-text-secondary">{runs(c)}</span> },
    { key: "spend", label: "Spend", align: "end", render: (c) => money(c.spend) },
    { key: "visitors", label: "Visitors", align: "end", render: (c) => c.visitors.toLocaleString("en-IN") },
    { key: "bookings", label: "Bookings", align: "end", render: (c) => c.bookings },
    { key: "revenue", label: "Revenue", align: "end", render: (c) => <strong className="font-semibold">{money(c.revenue)}</strong> },
    { key: "cpb", label: "Cost / booking", align: "end", render: (c) => (c.cost_per_booking ? money(c.cost_per_booking) : <span className="text-text-tertiary">—</span>) },
    { key: "status", label: "Status", hideOnMobile: true, render: (c) => <StatusPill status={c.is_active ? "ACTIVE" : "PAUSED"} label={c.is_active ? "On" : "Off"} tone={c.is_active ? "green" : "gray"} /> },
  ];

  return (
    <>
      <DataTable rows={rows} loading={loading} rowKey={(c) => c.id} columns={columns}
        actions={(c) => <>
          {c.utm_campaign && <Button size="small" variant="secondary" leadingIcon={RiLinksLine} onClick={() => setLinkFor(c)}>Link</Button>}
          {can.add_cost && <Button size="small" variant="secondary" onClick={() => setCostFor(c)}>Add cost</Button>}
        </>}
        empty={<Empty title="No campaigns yet" sub="Add a campaign, share its tracked link, and see the visitors and bookings it brings in." />} />
      {creating && <CampaignForm onClose={onCloseCreate} onSaved={() => { onCloseCreate(); onChanged(); }} />}
      {costFor && <CostForm campaign={costFor} onClose={() => setCostFor(null)} onSaved={() => { setCostFor(null); onChanged(); }} />}
      {linkFor && <UtmLinkBuilder campaign={linkFor} onClose={() => setLinkFor(null)} />}
    </>
  );
}

function runs(c: CampaignRow) {
  if (!c.starts_on && !c.ends_on) return "Ongoing";
  return `${c.starts_on ? dateOnly(c.starts_on) : "…"} – ${c.ends_on ? dateOnly(c.ends_on) : "ongoing"}`;
}

function CampaignForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [tagEdited, setTagEdited] = useState(false);
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const { busy, errors, general, submit } = useFormSubmit();
  const utm = tagEdited ? tag : slugify(name);

  const save = async () => {
    const ok = await submit(() => adminApi.create("campaigns", { name: name.trim(), utm_campaign: utm, starts_on: starts || null, ends_on: ends || null, is_active: true }));
    if (ok) onSaved();
  };
  return (
    <FormModal title="New campaign" description="Bookings from people who arrive through this campaign's link are counted against it."
      submitLabel="Create campaign" busy={busy} general={general} canSubmit={!!name.trim() && !!utm} onSubmit={save} onClose={onClose}>
      <Input label="Name" value={name} onChange={setName} placeholder="Diwali treks — Instagram" errorMessage={errors.name} />
      <Input label="Tracking tag (utm_campaign)" value={utm} onChange={(v) => { setTagEdited(true); setTag(slugify(v)); }}
        hint="Lower-case words joined by dashes. It appears in the link you share." errorMessage={errors.utm_campaign} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Starts (optional)" type="date" value={starts} onChange={setStarts} errorMessage={errors.starts_on} />
        <Input label="Ends (optional)" type="date" value={ends} onChange={setEnds} errorMessage={errors.ends_on} />
      </div>
    </FormModal>
  );
}

function CostForm({ campaign, onClose, onSaved }: { campaign: CampaignRow; onClose: () => void; onSaved: () => void }) {
  const [day, setDay] = useState(toDay(new Date().toISOString()));
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const { busy, errors, general, submit } = useFormSubmit();
  const save = async () => {
    const ok = await submit(() => adminApi.create("campaign-costs", { campaign: campaign.id, spent_on: day, amount: Number(amount).toFixed(2), note: note.trim() }));
    if (ok) onSaved();
  };
  return (
    <FormModal title={`Add cost · ${campaign.name}`} description="Ad spend, printing, influencer fees… Used for cost per booking."
      submitLabel="Add cost" busy={busy} general={general} canSubmit={Number(amount) > 0 && !!day} onSubmit={save} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Date" type="date" value={day} onChange={setDay} errorMessage={errors.spent_on} />
        <Input label="Amount (₹)" type="number" value={amount} onChange={setAmount} errorMessage={errors.amount} />
      </div>
      <Input label="Note (optional)" value={note} onChange={setNote} placeholder="Instagram boost, week 1" errorMessage={errors.note} />
    </FormModal>
  );
}

const SOURCES = [
  { source: "instagram", medium: "social", label: "Instagram" },
  { source: "facebook", medium: "social", label: "Facebook" },
  { source: "whatsapp", medium: "message", label: "WhatsApp" },
  { source: "google", medium: "cpc", label: "Google ads" },
  { source: "newsletter", medium: "email", label: "Email" },
  { source: "poster", medium: "offline", label: "Poster / QR code" },
];

/** Builds the tracked link to share: any page on the site + utm_source / utm_medium / utm_campaign. */
function UtmLinkBuilder({ campaign, onClose }: { campaign: CampaignRow; onClose: () => void }) {
  const [path, setPath] = useState("/");
  const [source, setSource] = useState(SOURCES[0].source);
  const link = useMemo(() => {
    const chosen = SOURCES.find((s) => s.source === source) ?? SOURCES[0];
    const url = new URL(path.startsWith("/") ? path : `/${path}`, SITE_URL);
    url.searchParams.set("utm_source", chosen.source);
    url.searchParams.set("utm_medium", chosen.medium);
    url.searchParams.set("utm_campaign", campaign.utm_campaign);
    return url.toString();
  }, [path, source, campaign.utm_campaign]);

  return (
    <Modal isOpen onOpenChange={(open) => !open && onClose()} size="md">
      {() => (
        <>
          <ModalHeader title="Tracked link" description={`Share this link so visits and bookings count towards “${campaign.name}”.`} />
          <ModalBody>
            <div className="flex flex-col gap-4">
              <Input label="Page" value={path} onChange={setPath} hint="For example / for the home page, or /events/box-cricket-community-play-day" />
              <div className="flex flex-col gap-2">
                <span className="text-body-medium text-text-primary">Where will you post it?</span>
                <div className="flex flex-wrap gap-2">
                  {SOURCES.map((s) => (
                    <Button key={s.source} size="small" variant={s.source === source ? "primary" : "secondary"} onClick={() => setSource(s.source)}>{s.label}</Button>
                  ))}
                </div>
              </div>
              <p className="break-all rounded-lg bg-background-secondary-default p-3 font-mono text-caption-1-medium text-text-primary">{link}</p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button variant="primary" onClick={() => copyText(link, "Link copied")}>Copy link</Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}
