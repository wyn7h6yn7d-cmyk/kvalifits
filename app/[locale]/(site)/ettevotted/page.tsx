import { Building2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CompaniesEmptyState } from "@/components/companies/CompaniesEmptyState";
import { CompanyCard } from "@/components/companies/CompanyCard";
import { CompanySearchForm } from "@/components/companies/CompanySearchForm";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/container";
import { loadPublicCompanies } from "@/lib/companies/loadPublicCompanies";
import { NOINDEX_FOLLOW, publicPageMetadata, searchParamsIndicateDuplicateLanding } from "@/lib/seo/site";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; industry?: string; location?: string; page?: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "pages.companies" });
  return publicPageMetadata({
    locale,
    path: "/ettevotted",
    title: t("title"),
    description: t("description"),
    robots: searchParamsIndicateDuplicateLanding(sp) ? NOINDEX_FOLLOW : undefined,
  });
}

function firstString(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return (v[0] ?? "").toString();
  return (v ?? "").toString();
}

function buildCompanyPageUrl(q: string, industry: string, location: string, page: number): string {
  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  if (industry) sp.set("industry", industry);
  if (location) sp.set("location", location);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `?${qs}` : "?";
}

export default async function EttevottedPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "pages.companies" });
  const tUi = await getTranslations({ locale, namespace: "companies" });

  const q = firstString(sp.q).trim();
  const industry = firstString(sp.industry).trim();
  const location = firstString(sp.location).trim();

  const rawPage = parseInt(firstString(sp.page) || "1", 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;

  const supabase = await createSupabaseServerClient();
  const { companies, industries, locations, totalCount, totalPages, page: currentPage } = await loadPublicCompanies(supabase, {
    q,
    industry,
    location,
    page,
  });

  return (
    <div className="bg-background">
      <PageHero
        eyebrow={t("heroEyebrow")}
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
        innerClassName="max-w-4xl lg:max-w-5xl"
        titleClassName="text-[2rem] sm:text-[2.375rem] lg:text-[clamp(2.5rem,3.5vw+1rem,3.5rem)] lg:leading-[1.08]"
        subtitleClassName="max-w-2xl text-[1.0625rem] sm:text-[1.125rem] lg:text-[1.1875rem]"
        contentClassName="pb-5 sm:pb-6 lg:pb-7"
        ctaClassName="mt-6 sm:mt-7 lg:mt-8"
      >
        <CompanySearchForm
          q={q}
          industry={industry}
          location={location}
          industries={industries}
          locations={locations}
          labels={{
            search: tUi("searchLabel"),
            searchPlaceholder: tUi("searchPlaceholder"),
            industry: tUi("industryLabel"),
            location: tUi("locationLabel"),
            all: tUi("filterAll"),
            submit: tUi("searchSubmit"),
            reset: tUi("searchReset"),
          }}
        />
      </PageHero>

      <section className="pb-12 sm:pb-14 lg:pb-16">
        <Container>
          {!companies.length ? (
            <CompaniesEmptyState
              icon={Building2}
              title={q || industry || location ? tUi("emptyFiltered") : tUi("empty")}
            />
          ) : (
            <>
              <ul className={cn("grid list-none gap-4 p-0 sm:gap-5 lg:grid-cols-2 lg:gap-5 xl:gap-6")}>
                {companies.map((company) => (
                  <li key={company.id}>
                    <CompanyCard company={company} verifiedLabel={tUi("verifiedBadge")} />
                  </li>
                ))}
              </ul>
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-between text-sm sm:text-[0.9375rem]">
                  {currentPage > 1 ? (
                    <a
                      href={buildCompanyPageUrl(q, industry, location, currentPage - 1)}
                      className="text-body hover:text-foreground"
                    >
                      ← {tUi("paginationPrev")}
                    </a>
                  ) : (
                    <span />
                  )}
                  <span className="text-muted-2 tabular-nums">
                    {tUi("paginationStatus", { page: currentPage, totalPages, totalCount })}
                  </span>
                  {currentPage < totalPages ? (
                    <a
                      href={buildCompanyPageUrl(q, industry, location, currentPage + 1)}
                      className="text-body hover:text-foreground"
                    >
                      {tUi("paginationNext")} →
                    </a>
                  ) : (
                    <span />
                  )}
                </div>
              )}
            </>
          )}
        </Container>
      </section>
    </div>
  );
}
