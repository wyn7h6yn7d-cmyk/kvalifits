import { getTranslations } from "next-intl/server";

import { HomepageCompanyCarousel } from "@/components/sections/HomepageCompanyCarousel";
import { Container } from "@/components/ui/container";
import { getHomepageShowcaseCompanies } from "@/lib/companies/loadHomepageShowcaseCompanies";
import { SITE_H2_SECTION } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

export async function HomepageCompaniesSection() {
  const companies = await getHomepageShowcaseCompanies();
  if (!companies.length) return null;

  const t = await getTranslations("homeCompanies");

  return (
    <section
      className="border-b border-border bg-surface py-9 sm:py-11 lg:py-12"
      aria-labelledby="home-companies-title"
    >
      <Container>
        <h2
          id="home-companies-title"
          className={cn("text-center", SITE_H2_SECTION)}
        >
          {t("title")}
        </h2>
        <div className="mt-5 sm:mt-6">
          <HomepageCompanyCarousel companies={companies} logoAlt={(name) => t("logoAlt", { name })} />
        </div>
      </Container>
    </section>
  );
}
