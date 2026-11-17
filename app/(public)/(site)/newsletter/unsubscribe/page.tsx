import type { Metadata } from "next";
import { UnsubscribeForm } from "@/components/site/UnsubscribeForm";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({ title: "Unsubscribe", path: "/newsletter/unsubscribe", noindex: true });

/** Where the unsubscribe link in each newsletter email lands (?token=…, made by gohyd-api crm/newsletter.py). */
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return (
    <div className="wrap">
      <div className="eyebrow">GoHyderabad · Newsletter</div>
      <h1 className="bk-title">Unsubscribe</h1>
      <div className="bk-narrow"><UnsubscribeForm token={token} /></div>
    </div>
  );
}
