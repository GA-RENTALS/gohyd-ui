"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CustomerProvider, useCustomer } from "./CustomerProvider";

const initialOf = (name: string) => (name.match(/[A-Za-z0-9]/)?.[0] ?? "").toUpperCase();

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c.9-3.6 3.9-5.4 7.5-5.4s6.6 1.8 7.5 5.4" />
    </svg>
  );
}

/** "Sign in" when signed out, otherwise the customer's avatar with a small menu. Must sit inside <CustomerProvider>. */
export function AccountMenu() {
  const { user, loading, signOut } = useCustomer();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  if (loading) return <span className="acct-btn acct-skeleton" aria-hidden="true" />;

  if (!user) {
    return (
      <Link href="/login" className="acct-btn acct-signin" aria-label="Sign in" title="Sign in">
        <PersonIcon />
      </Link>
    );
  }

  const label = user.full_name || user.phone_number;
  return (
    <div className="acct" ref={box}>
      <button type="button" className="acct-btn acct-avatar" aria-haspopup="menu" aria-expanded={open} aria-label={`Account menu for ${label}`} onClick={() => setOpen((v) => !v)}>
        {initialOf(user.full_name) || <PersonIcon />}
      </button>
      {open && (
        <div className="acct-menu" role="menu">
          <div className="acct-who">
            <strong>{user.full_name || "Welcome"}</strong>
            <small>{user.phone_number}</small>
          </div>
          <Link role="menuitem" href="/account" onClick={() => setOpen(false)}>My bookings</Link>
          <Link role="menuitem" href="/trips" onClick={() => setOpen(false)}>Book a trip</Link>
          <button role="menuitem" type="button" onClick={async () => { setOpen(false); await signOut(); router.push("/"); }}>Sign out</button>
        </div>
      )}
    </div>
  );
}

/** For pages that are not inside the booking layout (the home page): brings its own customer session. */
export function HeaderAccount() {
  return (
    <CustomerProvider>
      <AccountMenu />
    </CustomerProvider>
  );
}
