import { getTranslations } from "next-intl/server";

import { HomepageCompanyCarousel } from "@/components/sections/HomepageCompanyCarousel";
import { HomeSectionShell } from "@/components/sections/home/HomeSectionShell";
import { getHomepageShowcaseCompanies } from "@/lib/companies/loadHomepageShowcaseCompanies";
import { SITE_H2_HOME } from "@/lib/site/publicPageLayout";

/**
 * Admin-approved company logos only — quiet trust strip, not a sponsor banner.
 */
export async function HomepageCompaniesSection() {
  const companies = await getHomepageShowcaseCompanies();
  if (!companies.length) return null;

  const t = await getTranslations("homeCompanies");

  return (
    <HomeSectionShell tone="base" aria-labelledby="home-companies-title">
      <div className="mb-8 flex flex-col items-center text-center sm:mb-10 lg:mb-12">
        <div className="mb-5 flex items-center gap-3" aria-hidden>
          <span className="h-px w-8 bg-white/[0.12]" />
          <span className="h-1 w-1 rounded-full bg-[var(--accent-pink)]/70" />
          <span className="h-px w-8 bg-white/[0.12]" />
        </div>
        <h2 id="home-companies-title" className={SITE_H2_HOME}>
          {t("title")}
        </h2>
      </div>
      <HomepageCompanyCarousel companies={companies} logoAlt={(name) => t("logoAlt", { name })} />
    </HomeSectionShell>
  );
}
