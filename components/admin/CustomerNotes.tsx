"use client";
/** Staff notes on a customer (calls, WhatsApp chats, preferences), newest first. Stored as CRM customer interactions. */
import { useState } from "react";
import { ago, Card, Empty, nice } from "@/components/admin/ui";
import { Button } from "@/components/base/buttons/button";
import { toast } from "@/components/base/toast/toast";
import { adminApi, type CustomerNote, type NoteChannel } from "@/lib/admin/api";

const CHANNELS: { key: NoteChannel; label: string }[] = [
  { key: "note", label: "Note" }, { key: "call", label: "Call" }, { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email" }, { key: "in_person", label: "In person" },
];

export function CustomerNotes({ customerId, notes: initial, canAdd }: { customerId: string; notes: CustomerNote[]; canAdd: boolean }) {
  const [notes, setNotes] = useState(initial);
  const [text, setText] = useState("");
  const [channel, setChannel] = useState<NoteChannel>("note");
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    try {
      setNotes(await adminApi.addCustomerNote(customerId, text.trim(), channel));
      setText("");
      setChannel("note");
    } catch (e: any) {
      toast(e?.message || "Couldn't save the note", { status: "error" });
    } finally {
      setBusy(false);
    }
  }

  const field = "rounded-xl border border-border-button-default bg-background-primary-default px-3 text-body-medium text-text-primary outline-none focus:border-text-secondary";
  return (
    <Card title="Staff notes" sub="Only staff see these. Use them for calls, preferences and anything the next person should know.">
      {canAdd && (
        <form className="mb-4 flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim() && !busy) add(); }}>
          <label className="sr-only" htmlFor="note-text">New note</label>
          <textarea id="note-text" rows={2} value={text} onChange={(e) => setText(e.target.value)} maxLength={2000}
            placeholder="e.g. Called about the balance; will pay on Friday" className={`${field} py-2`} />
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="note-channel">How</label>
            <select id="note-channel" value={channel} onChange={(e) => setChannel(e.target.value as NoteChannel)} className={`${field} h-9`}>
              {CHANNELS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <Button type="submit" size="small" variant="primary" disabled={!text.trim() || busy}>{busy ? "Saving…" : "Add note"}</Button>
          </div>
        </form>
      )}
      {notes.length === 0 ? <Empty title="No notes yet" /> : (
        <ol className="flex flex-col divide-y divide-separator-border">
          {notes.map((n) => (
            <li key={n.id} className="py-3 first:pt-0 last:pb-0">
              <p className="whitespace-pre-wrap text-body-regular text-text-primary">{n.text}</p>
              <p className="mt-1 text-caption-1-medium text-text-tertiary">{CHANNELS.find((c) => c.key === n.channel)?.label ?? nice(n.channel)} · {n.by || "Staff"} · {ago(n.created_at)}</p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
