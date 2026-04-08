import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { PageHero } from "@/components/site/PageHero";
import { JobsSearch } from "@/components/jobs/JobsSearch";
import { MOCK_JOBS } from "@/components/jobs/mock-data";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.jobs" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ToodPage() {
  const t = await getTranslations("pages.jobs");

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <PageHero
          eyebrow={t("heroEyebrow")}
          title={t("heroTitle")}
          subtitle={t("heroSubtitle")}
        />
        <JobsSearch jobs={MOCK_JOBS} />
      </main>
      <Footer />
    </div>
  );
}
