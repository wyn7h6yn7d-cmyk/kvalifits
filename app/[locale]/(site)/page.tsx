import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { FinalCTA } from "@/components/sections/FinalCTA";
import { Hero } from "@/components/sections/Hero";
import { HomepageAudienceSection } from "@/components/sections/HomepageAudienceSection";
import { HomepageBenefitsSection } from "@/components/sections/HomepageBenefitsSection";
import { HomepageCompaniesSection } from "@/components/sections/HomepageCompaniesSection";
import { HomepageHeroBand } from "@/components/sections/HomepageHeroBand";
import { HomepageJobsSection } from "@/components/sections/HomepageJobsSection";
import { HomepageMatchDemoSection } from "@/components/sections/HomepageMatchDemoSection";
import { HomepageRealLifeSection } from "@/components/sections/HomepageRealLifeSection";
import { HomepageTestimonialsSection } from "@/components/sections/HomepageTestimonialsSection";
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
      {/* 1. Hero + job search + person photo */}
      <HomepageHeroBand>
        <Hero embedded quickFilters={quickFilters} />
      </HomepageHeroBand>
      <HomepageBodyAtmosphere>
        {/* 2. New / featured jobs */}
        <HomepageJobsSection locale={locale} />
        {/* 3. Kvalifits in real life */}
        <HomepageRealLifeSection />
        {/* Success stories — omitted when no approved testimonials */}
        <HomepageTestimonialsSection locale={locale} />
        {/* 4. Three simple advantages */}
        <HomepageBenefitsSection />
        {/* 5. Company logo carousel */}
        <HomepageCompaniesSection />
        {/* 6. Seeker / employer */}
        <HomepageAudienceSection />
        {/* 7. One compact match demo */}
        <HomepageMatchDemoSection />
        {/* 8. Final CTA — Footer via PublicSiteShell */}
        <FinalCTA />
      </HomepageBodyAtmosphere>
    </>
  );
}
