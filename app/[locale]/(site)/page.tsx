import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Hero } from "@/components/sections/Hero";
import { LoginAnchor } from "@/components/sections/LoginAnchor";
import { WhyKvalifits } from "@/components/sections/WhyKvalifits";
import { Audience } from "@/components/sections/Audience";
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
  await params;
  const quickFilters = await getHeroQuickFilters();

  return (
    <>
      <WebsiteJsonLd />
      <Hero quickFilters={quickFilters} />
      <WhyKvalifits />
      <Audience />
      <FinalCTA />
      <LoginAnchor />
    </>
  );
}
