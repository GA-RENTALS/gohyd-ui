import type { ReactNode } from "react";
import { CustomerProvider } from "@/components/booking/CustomerProvider";
import { SiteNav } from "@/components/booking/SiteNav";
import "./booking.css";

/** Shared frame for the booking pages: trips, login, checkout and the customer's account. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <CustomerProvider>
      <SiteNav />
      <main className="bk-main">{children}</main>
      <footer className="bk-footer">
        <div className="wrap">
          <span>© {new Date().getFullYear()} GoHyderabad · Meet · Explore · Experience</span>
          <a href="https://www.instagram.com/gohyderabad/" target="_blank" rel="noopener noreferrer">Instagram ↗</a>
        </div>
      </footer>
    </CustomerProvider>
  );
}
