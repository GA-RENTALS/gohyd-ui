"use client";
/**
 * Team & roles: who can use the admin, their role, and what each role may do.
 * Data: /admin/team/ (admin_api/team.py). The server enforces every rule; this page only hides what you can't do.
 */
import { RiUserAddLine } from "@remixicon/react";
import { useCallback, useEffect, useState } from "react";
import { FormModal, useFormSubmit } from "@/components/admin/FormModal";
import { listQuery, useAction, useDebounced } from "@/components/admin/hooks";
import { ago, Card, type Column, DataTable, Empty, PageTitle, Person, SearchBox, StatusPill } from "@/components/admin/ui";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { toast } from "@/components/base/toast/toast";
import { adminApi, ApiError, type AccessLevel, type RoleInfo, type TeamMember, type TeamPage as TeamData } from "@/lib/admin/api";
import { cx } from "@/utils/cx";

type Dialog = { kind: "invite" } | { kind: "role"; member: TeamMember } | { kind: "active"; member: TeamMember } | null;

export function TeamPage() {
  const [data, setData] = useState<TeamData | null>(null);
  const [denied, setDenied] = useState(false);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const q = useDebounced(search);

  const load = useCallback(() => {
    adminApi.team(listQuery({}, undefined, q)).then(setData).catch((e) => {
      if (e instanceof ApiError && e.status === 403) setDenied(true);
      else toast(e.message, { status: "error" });
    });
  }, [q]);
  useEffect(load, [load]);
  const { busy, run } = useAction(load);

  if (denied) return <><PageTitle title="Team & roles" /><Card><Empty title="Only admins can see the team" sub="Ask an admin if you need someone added or your role changed." /></Card></>;

  const manage = !!data?.can.manage;
  const close = () => setDialog(null);
  const saved = () => { close(); load(); };

  const columns: Column<TeamMember>[] = [
    { key: "who", label: "Person", render: (m) => <Person name={m.name} sub={m.is_you ? `${m.phone} · you` : m.phone} /> },
    { key: "role", label: "Role", render: (m) => (
      <span className="flex flex-wrap items-center gap-1.5">
        {m.role || <span className="text-text-tertiary">No role</span>}
        {m.is_superuser && <StatusPill status="info" tone="blue" label="Platform admin" />}
      </span>
    ) },
    { key: "seen", label: "Last sign-in", render: (m) => <span className="whitespace-nowrap text-text-secondary">{m.last_sign_in ? ago(m.last_sign_in) : "Never"}</span> },
    { key: "status", label: "Status", render: (m) => <StatusPill status={m.active ? "ACTIVE" : "INACTIVE"} label={m.active ? "Active" : "Deactivated"} tone={m.active ? "green" : "gray"} /> },
  ];

  return (
    <>
      <PageTitle title="Team & roles" sub="Who can use this admin, and what each person can see and change."
        actions={manage && <Button variant="primary" leadingIcon={RiUserAddLine} onClick={() => setDialog({ kind: "invite" })}>Invite staff</Button>} />

      <div className="mb-4 flex justify-end"><SearchBox value={search} onChange={setSearch} placeholder="Name, phone or email…" /></div>
      <Card pad={false} className="mb-6">
        <DataTable rows={data?.results ?? null} rowKey={(m) => m.id} columns={columns}
          actions={manage ? (m) => m.is_you ? null : <>
            {m.active && <Button size="small" variant="secondary" onClick={() => setDialog({ kind: "role", member: m })}>Change role</Button>}
            <Button size="small" variant="secondary" disabled={busy === m.id} onClick={() => setDialog({ kind: "active", member: m })}>{m.active ? "Deactivate" : "Reactivate"}</Button>
          </> : undefined}
          empty={<Empty title={search ? `Nobody matches “${search}”` : "No staff yet"} sub="Invite people by their mobile number. They sign in with a WhatsApp code." />} />
      </Card>

      {data && <RoleMatrix roles={data.roles} areas={data.areas} />}

      {dialog?.kind === "invite" && data && <InviteForm roles={rolesFor(data)} onClose={close} onSaved={saved} />}
      {dialog?.kind === "role" && data && <RoleForm member={dialog.member} roles={rolesFor(data)} onClose={close} onSaved={saved} />}
      {dialog?.kind === "active" && (
        <ConfirmActive member={dialog.member} onClose={close}
          onConfirm={() => run(dialog.member.id, () => adminApi.updateStaff(dialog.member.id, { active: !dialog.member.active }),
            dialog.member.active ? `${dialog.member.name} can no longer sign in to the admin` : `${dialog.member.name} can sign in again`).then(close)} />
      )}
    </>
  );
}

const rolesFor = (data: TeamData) => data.roles.filter((r) => data.can.roles.includes(r.name) && r.exists);

/* ---------- role matrix ---------- */

const LEVEL: Record<Exclude<AccessLevel, "">, { label: string; className: string }> = {
  full: { label: "Full", className: "bg-emerald-500/14 text-emerald-700 dark:text-emerald-400" },
  edit: { label: "Edit", className: "bg-blue-500/12 text-blue-700 dark:text-blue-400" },
  view: { label: "View", className: "bg-background-secondary-default text-text-secondary" },
};

function RoleMatrix({ roles, areas }: { roles: RoleInfo[]; areas: { key: string; label: string }[] }) {
  return (
    <Card title="What each role can do" sub="Full = see, add, change and delete · Edit = see, add and change · View = see only">
      <div className="-mx-5 overflow-x-auto">
        <table className="w-full min-w-[760px] text-body-medium">
          <thead>
            <tr className="border-b border-separator-border">
              <th scope="col" className="px-5 py-2 text-start text-caption-1-medium uppercase tracking-wide text-text-tertiary">Role</th>
              {areas.map((a) => <th key={a.key} scope="col" className="px-2 py-2 text-center text-caption-1-medium uppercase tracking-wide text-text-tertiary">{a.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.name} className="border-b border-separator-border last:border-b-0">
                <th scope="row" className="px-5 py-2.5 text-start font-normal">
                  <span className="block text-text-primary">{r.name}</span>
                  <span className="block max-w-[260px] text-caption-1-medium text-text-tertiary">{r.description}</span>
                </th>
                {areas.map((a) => {
                  const level = r.access[a.key];
                  return (
                    <td key={a.key} className="px-2 py-2.5 text-center">
                      {level ? <span className={cx("rounded-md px-2 py-0.5 text-caption-1-medium", LEVEL[level].className)}>{LEVEL[level].label}</span>
                        : <span className="text-text-tertiary" aria-label="No access">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ---------- dialogs ---------- */

/** Radio list of roles with a one-line description each. */
function RolePicker({ roles, value, onChange, error }: { roles: RoleInfo[]; value: string; onChange: (r: string) => void; error?: string }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-body-medium text-text-primary">Role</legend>
      <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto pe-1">
        {roles.map((r) => (
          <label key={r.name} className={cx("flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors",
            value === r.name ? "border-text-secondary bg-background-secondary-default" : "border-border-button-default hover:bg-background-secondary-default/60")}>
            <input type="radio" name="role" className="mt-1" checked={value === r.name} onChange={() => onChange(r.name)} />
            <span><span className="block text-body-medium text-text-primary">{r.name}</span><span className="block text-caption-1-medium text-text-secondary">{r.description}</span></span>
          </label>
        ))}
      </div>
      {error && <p role="alert" className="text-caption-1-medium text-rose-600 dark:text-rose-400">{error}</p>}
    </fieldset>
  );
}

function InviteForm({ roles, onClose, onSaved }: { roles: RoleInfo[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const { busy, errors, general, submit } = useFormSubmit();
  const save = async () => {
    if (await submit(() => adminApi.inviteStaff({ name: name.trim(), phone: phone.trim(), role }))) {
      toast(`${name.trim()} can now sign in to the admin with ${phone.trim()}`, { status: "success" });
      onSaved();
    }
  };
  return (
    <FormModal title="Invite staff" description="They sign in at the admin login with this mobile number and a WhatsApp code. No password to share."
      submitLabel="Invite" busy={busy} general={general} canSubmit={!!name.trim() && !!phone.trim() && !!role} onSubmit={save} onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Name" value={name} onChange={setName} errorMessage={errors.name} />
        <Input label="Mobile number" type="tel" value={phone} onChange={setPhone} placeholder="98765 43210" errorMessage={errors.phone} />
      </div>
      <RolePicker roles={roles} value={role} onChange={setRole} error={errors.role} />
    </FormModal>
  );
}

function RoleForm({ member, roles, onClose, onSaved }: { member: TeamMember; roles: RoleInfo[]; onClose: () => void; onSaved: () => void }) {
  const [role, setRole] = useState(member.role);
  const { busy, errors, general, submit } = useFormSubmit();
  const save = async () => {
    if (await submit(() => adminApi.updateStaff(member.id, { role }))) {
      toast(`${member.name} is now ${role}`, { status: "success" });
      onSaved();
    }
  };
  return (
    <FormModal title={`Change role · ${member.name}`} description="The new access applies from their next click."
      submitLabel="Save role" busy={busy} general={general || errors.detail} canSubmit={!!role && role !== member.role} onSubmit={save} onClose={onClose}>
      <RolePicker roles={roles} value={role} onChange={setRole} error={errors.role} />
    </FormModal>
  );
}

function ConfirmActive({ member, onConfirm, onClose }: { member: TeamMember; onConfirm: () => Promise<unknown>; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const deactivate = member.active;
  return (
    <FormModal title={deactivate ? `Deactivate ${member.name}?` : `Reactivate ${member.name}?`}
      submitLabel={deactivate ? "Deactivate" : "Reactivate"} busy={busy} onClose={onClose}
      onSubmit={() => { setBusy(true); onConfirm().catch(() => setBusy(false)); }}>
      <p className="text-body-regular text-text-secondary">
        {deactivate
          ? "They are signed out of the admin straight away. Their history and any bookings they made as a customer are kept. You can reactivate them later."
          : `They can sign in to the admin again as ${member.role || "their previous role"}.`}
      </p>
    </FormModal>
  );
}
