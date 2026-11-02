import fs from "node:fs";
import path from "node:path";
import PageBehavior from "@/components/PageBehavior";

export default function Home() {
  // Page markup is the original index.html body, kept verbatim.
  const html = fs.readFileSync(path.join(process.cwd(), "components/body.html"), "utf8");

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <PageBehavior />
    </>
  );
}
