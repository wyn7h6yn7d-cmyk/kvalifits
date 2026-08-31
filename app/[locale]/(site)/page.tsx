import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { FeaturedJobsSection } from "@/components/sections/FeaturedJobsSection";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Hero } from "@/components/sections/Hero";
import { NewJobsSection } from "@/components/sections/NewJobsSection";
import { HomepageAudienceSection } from "@/components/sections/HomepageAudienceSection";
import { HomepageBenefitsSection } from "@/components/sections/HomepageBenefitsSection";
import { HomepageCompaniesSection } from "@/components/sections/HomepageCompaniesSection";
import { HomepageFaqSection } from "@/components/sections/HomepageFaqSection";
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
      <Hero quickFilters={quickFilters} publishedJobCount={publishedJobCount} />
      <HomepageAudienceSection />
      <FeaturedJobsSection locale={locale} />
      <NewJobsSection locale={locale} />
      <HomepageBenefitsSection />
      <HomepageCompaniesSection />
      <HomepageFaqSection />
      <FinalCTA />
    </>
  );
}
