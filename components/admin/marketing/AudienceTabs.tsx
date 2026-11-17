"use client";
/** Newsletter subscribers and referral campaigns: the two smaller marketing tabs. */
import { useState } from "react";
import { FormModal, useFormSubmit } from "@/components/admin/FormModal";
import { useAction } from "@/components/admin/hooks";
import { type Column, DataTable, dateOnly, Empty, money, StatusPill } from "@/components/admin/ui";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { AlertDialog } from "@/components/base/modal/modal";
import { adminApi, type ReferralRow, type SubscriberRow } from "@/lib/admin/api";
import { setActive, type TabProps } from "./shared";

/**
 * A subscription is a record of consent (this address agreed on this date), so it has no Edit: changing the email would
 * claim consent the new address never gave. Staff can unsubscribe someone who asks by phone or email, and delete the
 * row when a person asks for their data to be erased.
 */
export function SubscribersTab({ rows, loading, can, onChanged }: TabProps<SubscriberRow>) {
  const { busy, run } = useAction(onChanged);
  const [deleting, setDeleting] = useState<SubscriberRow | null>(null);
  const unsubscribe = (s: SubscriberRow) =>
    run(s.id, () => adminApi.update("newsletters", s.id, { unsubscribed_at: new Date().toISOString() }), `${s.email} unsubscribed`).catch(() => {});
  const columns: Column<SubscriberRow>[] = [
    { key: "email", label: "Email", render: (s) => <span className="break-all">{s.email}</span> },
    { key: "joined", label: "Subscribed", render: (s) => <span className="whitespace-nowrap text-text-secondary">{dateOnly(s.consent_at)}</span> },
    { key: "status", label: "Status", render: (s) => s.subscribed
      ? <StatusPill status="ACTIVE" label="Subscribed" tone="green" />
      : <StatusPill status="UNSUBSCRIBED" label={`Left ${dateOnly(s.unsubscribed_at)}`} tone="gray" /> },
  ];
  return <>
    <DataTable rows={rows} loading={loading} rowKey={(s) => s.id} columns={columns}
      actions={can.update || can.delete ? (s) => <>
        {can.update && s.subscribed && <Button size="small" variant="secondary" disabled={busy === s.id} onClick={() => unsubscribe(s)}>Unsubscribe</Button>}
        {can.delete && <Button size="small" variant="secondary" disabled={busy === s.id} onClick={() => setDeleting(s)}>Delete</Button>}
      </> : undefined}
      empty={<Empty title="No subscribers yet" sub="People who sign up for the newsletter appear here. Use Export CSV to send them to your email tool." />} />
    <AlertDialog isOpen={!!deleting} onOpenChange={(open) => !open && setDeleting(null)} title={`Delete ${deleting?.email ?? ""}?`}
      description="Use this when the person asks for their data to be erased. To stop emails but keep the record of their consent, use Unsubscribe instead."
      confirmLabel="Delete" pendingLabel="Deleting…"
      onConfirm={async () => {
        if (!deleting) return;
        await run(deleting.id, () => adminApi.remove("newsletters", deleting.id), `${deleting.email} deleted`);
        setDeleting(null);
      }} />
  </>;
}

export function ReferralsTab({ rows, loading, can, onChanged, creating, onCloseCreate }: TabProps<ReferralRow>) {
  const { busy, run } = useAction(onChanged);
  const [editing, setEditing] = useState<ReferralRow | null>(null);
  const columns: Column<ReferralRow>[] = [
    { key: "name", label: "Campaign", render: (r) => r.name },
    { key: "rewards", label: "Rewards", render: (r) => <span className="text-text-secondary">Referrer {money(r.referrer_reward)} · Friend {money(r.referee_discount)} off</span> },
    { key: "referrals", label: "Referrals", align: "end", render: (r) => r.referrals },
    { key: "owed", label: "Rewards owed", align: "end", render: (r) => Number(r.rewards_owed) > 0
      ? <strong className="font-semibold text-amber-700 dark:text-amber-400">{money(r.rewards_owed)}</strong>
      : <span className="text-text-tertiary">—</span> },
    { key: "status", label: "Status", render: (r) => <StatusPill status={r.is_active ? "ACTIVE" : "PAUSED"} label={r.is_active ? "On" : "Off"} tone={r.is_active ? "green" : "gray"} /> },
  ];
  return (
    <>
      <DataTable rows={rows} loading={loading} rowKey={(r) => r.id} columns={columns}
        actions={can.update ? (r) => (
          <>
            <Button size="small" variant="secondary" disabled={busy === r.id} onClick={() => setEditing(r)}>Edit</Button>
            <Button size="small" variant="secondary" disabled={busy === r.id}
              onClick={() => run(r.id, () => setActive("referral-campaigns", r.id, !r.is_active), r.is_active ? `${r.name} switched off` : `${r.name} switched on`).catch(() => {})}>
              {r.is_active ? "Switch off" : "Switch on"}
            </Button>
          </>
        ) : undefined}
        empty={<Empty title="No referral campaigns" sub="Reward customers who bring friends: set what the referrer earns and what the friend saves." />} />
      {creating && !editing && <ReferralForm onClose={onCloseCreate} onSaved={() => { onCloseCreate(); onChanged(); }} />}
      {editing && <ReferralForm key={editing.id} campaign={editing} onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); onChanged(); }} />}
    </>
  );
}

function ReferralForm({ campaign, onClose, onSaved }: { campaign?: ReferralRow; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(campaign?.name ?? "");
  const [reward, setReward] = useState(campaign?.referrer_reward ?? "");
  const [discount, setDiscount] = useState(campaign?.referee_discount ?? "");
  const { busy, errors, general, submit } = useFormSubmit();
  const save = async () => {
    const body = {
      name: name.trim(), referrer_reward: Number(reward || 0).toFixed(2), referee_discount: Number(discount || 0).toFixed(2),
      is_active: campaign?.is_active ?? true,
    };
    const ok = await submit(() => campaign
      ? adminApi.update("referral-campaigns", campaign.id, body)
      : adminApi.create("referral-campaigns", body));
    if (ok) onSaved();
  };
  return (
    <FormModal title={campaign ? `Edit referral campaign · ${campaign.name}` : "New referral campaign"}
      submitLabel={campaign ? "Save changes" : "Create"} busy={busy} general={general} canSubmit={!!name.trim()} onSubmit={save} onClose={onClose}>
      <Input label="Name" value={name} onChange={setName} placeholder="Bring a friend" errorMessage={errors.name} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Referrer earns (₹)" type="number" value={reward} onChange={setReward} errorMessage={errors.referrer_reward} />
        <Input label="Friend saves (₹)" type="number" value={discount} onChange={setDiscount} errorMessage={errors.referee_discount} />
      </div>
    </FormModal>
  );
}
