import type { Metadata } from "next";
import Motion from "@/components/Motion";
import { pageMetadata } from "@/lib/site";
import PageBehavior from "@/components/PageBehavior";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteSprite } from "@/components/site/SiteSprite";
import { ArchEdge } from "@/components/site/sections/ArchEdge";
import { Closing } from "@/components/site/sections/Closing";
import { Community } from "@/components/site/sections/Community";
import { Events } from "@/components/site/sections/Events";
import { Experiences } from "@/components/site/sections/Experiences";
import { Explore } from "@/components/site/sections/Explore";
import { Hero } from "@/components/site/sections/Hero";
import { How } from "@/components/site/sections/How";
import { Stats } from "@/components/site/sections/Stats";
import { Upcoming } from "@/components/site/sections/Upcoming";
import { Voices } from "@/components/site/sections/Voices";
import { UpcomingEventsPopup } from "@/components/site/UpcomingEventsPopup";

export const metadata: Metadata = pageMetadata({ path: "/" });

export default function Home() {
  return (
    <>
      <div className="preloader" aria-hidden="true">
        <img src="/assets/logo.png" alt="" width={84} height={84} />
        <span className="bar" />
      </div>
      <SiteSprite />
      <SiteHeader />
      <main id="main">
        <Hero />
        <ArchEdge />
        <Events />
        <Stats />
        <Experiences />
        <Upcoming />
        <Explore />
        <Community />
        <How />
        <Voices />
        <Closing />
      </main>
      <SiteFooter />
      <UpcomingEventsPopup />
      <PageBehavior />
      <Motion />
    </>
  );
}
