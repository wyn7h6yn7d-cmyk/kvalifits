import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Hero } from "@/components/sections/Hero";
import { FeaturedJobsSection } from "@/components/sections/FeaturedJobsSection";
import { NewJobsSection } from "@/components/sections/NewJobsSection";
import { HomepageBenefitsSection } from "@/components/sections/HomepageBenefitsSection";
import { HomepageCompaniesSection } from "@/components/sections/HomepageCompaniesSection";
import { HomepageAudienceSection } from "@/components/sections/HomepageAudienceSection";
import { HomepageMatchDemo } from "@/components/sections/HomepageMatchDemo";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { WebsiteJsonLd } from "@/components/seo/WebsiteJsonLd";
import { getHeroQuickFilters } from "@/lib/jobs/getHeroQuickFilters";
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

  return (
    <>
      <WebsiteJsonLd />
      <Hero quickFilters={quickFilters} />
      <FeaturedJobsSection locale={locale} />
      <NewJobsSection locale={locale} />
      <HomepageBenefitsSection />
      <HomepageCompaniesSection />
      <HomepageAudienceSection />
      <HomepageMatchDemo />
      <FinalCTA />
    </>
  );
}
