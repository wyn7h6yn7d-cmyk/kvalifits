import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Hero } from "@/components/sections/Hero";
import { FeaturedJobsSection } from "@/components/sections/FeaturedJobsSection";
import { NewJobsSection } from "@/components/sections/NewJobsSection";
import { HomepageBenefitsSection } from "@/components/sections/HomepageBenefitsSection";
import { HomepageCompaniesSection } from "@/components/sections/HomepageCompaniesSection";
import { HomepageAudienceSection } from "@/components/sections/HomepageAudienceSection";
import { HomepageHeroBand } from "@/components/sections/HomepageHeroBand";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { WebsiteJsonLd } from "@/components/seo/WebsiteJsonLd";
import { getHeroQuickFilters } from "@/lib/jobs/getHeroQuickFilters";
import { getPublishedJobCountForHomepage } from "@/lib/jobs/loadPublishedJobCountForHomepage";
import { homepageBrandMetadata } from "@/lib/seo/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return homepageBrandMetadata({
    locale,
    description: t("description"),
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const quickFilters = await getHeroQuickFilters();
  const publishedJobCount = await getPublishedJobCountForHomepage();

  return (
    <>
      <WebsiteJsonLd />
      <HomepageHeroBand>
        <Hero
          quickFilters={quickFilters}
          publishedJobCount={publishedJobCount}
          showScrollHint
          embedded
        />
        <div
          id="home-jobs"
          className="scroll-mt-[calc(var(--site-header-offset)+1rem)]"
          aria-hidden
        />
        <FeaturedJobsSection locale={locale} embedded />
        <NewJobsSection locale={locale} embedded />
      </HomepageHeroBand>
      <HomepageCompaniesSection />
      <HomepageBenefitsSection />
      <HomepageAudienceSection />
      <FinalCTA />
    </>
  );
}
