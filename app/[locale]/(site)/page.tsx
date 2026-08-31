import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { FinalCTA } from "@/components/sections/FinalCTA";
import { Hero } from "@/components/sections/Hero";
import { HomepageHeroBand } from "@/components/sections/HomepageHeroBand";
import { NewJobsSection } from "@/components/sections/NewJobsSection";
import { HomepageAudienceSection } from "@/components/sections/HomepageAudienceSection";
import { HomepageBenefitsSection } from "@/components/sections/HomepageBenefitsSection";
import { HomepageFaqSection } from "@/components/sections/HomepageFaqSection";
import { WebsiteJsonLd } from "@/components/seo/WebsiteJsonLd";
import { HomepageBodyAtmosphere } from "@/components/site/HomepageBodyAtmosphere";
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
      <HomepageHeroBand>
        <Hero embedded quickFilters={quickFilters} />
      </HomepageHeroBand>
      <HomepageBodyAtmosphere>
        <HomepageAudienceSection />
        <NewJobsSection locale={locale} />
        <HomepageBenefitsSection />
        <HomepageFaqSection />
        <FinalCTA />
      </HomepageBodyAtmosphere>
    </>
  );
}
