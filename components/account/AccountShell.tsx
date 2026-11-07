"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCustomer } from "@/components/booking/CustomerProvider";

const initialOf = (name: string) => (name.match(/[A-Za-z0-9]/)?.[0] ?? "").toUpperCase();

const NAV = [
  { href: "/account", label: "My bookings", icon: "M3 5h18v16H3zM16 3v4M8 3v4M3 10h18" },
  { href: "/account/profile", label: "My details", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4-6 8-6s7 2 8 6" },
  { href: "/trips", label: "Browse trips", icon: "M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" },
] as const;

function NavIcon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
  );
}

/** The signed-in customer's area: a sidebar with their profile and links, and the page content beside it. */
export function AccountShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useCustomer();
  const pathname = usePathname();
  const router = useRouter();
  const name = user?.full_name || "Your account";

  return (
    <div className="ac-shell">
      <div className="ac-layout">
        <aside className="ac-side">
          <div className="ac-profile">
            <span className="ac-avatar" aria-hidden="true">{initialOf(user?.full_name ?? "") || "G"}</span>
            <div>
              <div className="ac-name">{name}</div>
              <Link href="/account/profile" className="ac-profile-link">View profile</Link>
            </div>
          </div>
          <nav className="ac-nav" aria-label="Account">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className={pathname === item.href ? "is-active" : undefined} aria-current={pathname === item.href ? "page" : undefined}>
                <NavIcon d={item.icon} />{item.label}
              </Link>
            ))}
            <a href="https://www.instagram.com/gohyderabad/" target="_blank" rel="noopener noreferrer">
              <NavIcon d="M4 13v-2a8 8 0 0 1 16 0v2M2 12h4v7H2zM18 12h4v7h-4z" />Support
            </a>
            <button type="button" className="ac-logout" onClick={async () => { await signOut(); router.push("/"); }}>
              <NavIcon d="M10 17l5-5-5-5M15 12H3M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" />Log out
            </button>
          </nav>
        </aside>
        <div className="ac-content">{children}</div>
      </div>
    </div>
  );
}
