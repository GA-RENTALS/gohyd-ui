import fs from "node:fs";
import path from "node:path";
import PageBehavior from "@/components/PageBehavior";
import Motion from "@/components/Motion";

export default function Home() {
  // Page markup is the original index.html body, kept verbatim.
  const html = fs.readFileSync(path.join(process.cwd(), "components/body.html"), "utf8");

  return (
    <>
      <div className="preloader" aria-hidden="true">
        <img src="/assets/logo.png" alt="" width={84} height={84} />
        <span className="bar" />
      </div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <PageBehavior />
      <Motion />
    </>
  );
}
