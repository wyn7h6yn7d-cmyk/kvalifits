import { Building2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/EmptyState";
import { CompanyCard } from "@/components/companies/CompanyCard";
import { CompanySearchForm } from "@/components/companies/CompanySearchForm";
import { SITE_GRID_GAP, SITE_SECTION_PB } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";
import { loadPublicCompanies } from "@/lib/companies/loadPublicCompanies";
import { NOINDEX_FOLLOW, publicPageMetadata, searchParamsIndicateDuplicateLanding } from "@/lib/seo/site";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    <>
      <PageHero eyebrow={t("heroEyebrow")} title={t("heroTitle")} subtitle={t("heroSubtitle")}>
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
      <section className={cn(SITE_SECTION_PB, "pt-0")}>
        <Container>
          {!companies.length ? (
            <EmptyState
              icon={Building2}
              title={q || industry || location ? tUi("emptyFiltered") : tUi("empty")}
            />
          ) : (
            <>
              <ul className={cn("mx-auto grid max-w-4xl list-none p-0", SITE_GRID_GAP)}>
                {companies.map((company) => (
                  <li key={company.id}>
                    <CompanyCard company={company} verifiedLabel={tUi("verifiedBadge")} />
                  </li>
                ))}
              </ul>
              {totalPages > 1 && (
                <div className="mx-auto mt-6 flex max-w-4xl items-center justify-between text-sm">
                  {currentPage > 1 ? (
                    <a href={buildCompanyPageUrl(q, industry, location, currentPage - 1)} className="text-white/70 hover:text-white">← {tUi("paginationPrev")}</a>
                  ) : <span />}
                  <span className="text-white/50 tabular-nums">
                    {tUi("paginationStatus", { page: currentPage, totalPages, totalCount })}
                  </span>
                  {currentPage < totalPages ? (
                    <a href={buildCompanyPageUrl(q, industry, location, currentPage + 1)} className="text-white/70 hover:text-white">{tUi("paginationNext")} →</a>
                  ) : <span />}
                </div>
              )}
            </>
          )}
        </Container>
      </section>
    </>
  );
}
