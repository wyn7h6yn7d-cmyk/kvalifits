import { getTranslations } from "next-intl/server";

import { HomepageCompanyCarousel } from "@/components/sections/HomepageCompanyCarousel";
import { Container } from "@/components/ui/container";
import { getHomepageShowcaseCompanies } from "@/lib/companies/loadHomepageShowcaseCompanies";

export async function HomepageCompaniesSection() {
  const companies = await getHomepageShowcaseCompanies();
  if (!companies.length) return null;

  const t = await getTranslations("homeCompanies");

  return (
    <section
      className="border-b border-white/[0.04] bg-surface py-9 sm:py-11 lg:py-12"
      aria-labelledby="home-companies-title"
    >
      <Container>
        <h2
          id="home-companies-title"
          className="text-balance text-center text-lg font-medium tracking-tight text-white/78 sm:text-xl"
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
