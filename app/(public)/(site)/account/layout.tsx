import type { ReactNode } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { RequireCustomer } from "@/components/booking/CustomerProvider";
import "./account.css";

/** Everything under /account needs a signed-in customer and shares the sidebar. */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <RequireCustomer>
      <AccountShell>{children}</AccountShell>
    </RequireCustomer>
  );
}
