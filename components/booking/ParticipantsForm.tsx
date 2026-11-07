"use client";
import type { Participant } from "@/lib/customer/types";

export const blankPerson = (): Participant => ({ full_name: "", age: null, phone: "", emergency_contact_name: "", emergency_contact_phone: "", medical_notes: "" });

/** One block of fields per person on the booking. People don't need accounts: the booker enters their details. */
export function ParticipantsForm({ idPrefix, people, onChange }: { idPrefix: string; people: Participant[]; onChange: (next: Participant[]) => void }) {
  const set = (i: number, patch: Partial<Participant>) => onChange(people.map((p, n) => (n === i ? { ...p, ...patch } : p)));
  return (
    <>
      {people.map((p, i) => {
        const id = `${idPrefix}-${i}`;
        return (
          <div className="bk-person" key={i}>
            <h3>{i === 0 ? "Person 1 (you)" : `Person ${i + 1}`}</h3>
            <div className="bk-field"><label htmlFor={`${id}-name`}>Full name</label><input id={`${id}-name`} value={p.full_name} onChange={(e) => set(i, { full_name: e.target.value })} autoComplete={i === 0 ? "name" : "off"} required /></div>
            <div className="bk-row-age">
              <div className="bk-field"><label htmlFor={`${id}-age`}>Age</label><input id={`${id}-age`} type="number" inputMode="numeric" min={1} max={100} value={p.age ?? ""} onChange={(e) => set(i, { age: e.target.value ? Number(e.target.value) : null })} /></div>
              <div className="bk-field"><label htmlFor={`${id}-phone`}>Phone</label><input id={`${id}-phone`} type="tel" inputMode="tel" value={p.phone} onChange={(e) => set(i, { phone: e.target.value })} /></div>
            </div>
            <div className="bk-row2 is-keep">
              <div className="bk-field"><label htmlFor={`${id}-ecn`}>Emergency contact</label><input id={`${id}-ecn`} value={p.emergency_contact_name} onChange={(e) => set(i, { emergency_contact_name: e.target.value })} /></div>
              <div className="bk-field"><label htmlFor={`${id}-ecp`}>Their phone</label><input id={`${id}-ecp`} type="tel" inputMode="tel" value={p.emergency_contact_phone} onChange={(e) => set(i, { emergency_contact_phone: e.target.value })} /></div>
            </div>
            <details className="bk-more" open={Boolean(p.medical_notes)}>
              <summary>Medical notes (optional)</summary>
              <div className="bk-field"><input aria-label="Medical notes" placeholder="Allergies, conditions or medication we should know about" value={p.medical_notes ?? ""} onChange={(e) => set(i, { medical_notes: e.target.value })} /></div>
            </details>
          </div>
        );
      })}
    </>
  );
}
