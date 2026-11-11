import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/booking/LoginForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function LoginPage() {
  // useSearchParams (the page to return to) needs a Suspense boundary
  return (
    <Suspense fallback={<p className="bk-note bk-narrow">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
