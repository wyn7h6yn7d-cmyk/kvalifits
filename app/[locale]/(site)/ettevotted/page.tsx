import { Building2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/EmptyState";
import { CompanyCard } from "@/components/companies/CompanyCard";
import { CompanySearchForm } from "@/components/companies/CompanySearchForm";
import { loadPublicCompanies } from "@/lib/companies/loadPublicCompanies";
import { NOINDEX_FOLLOW, publicPageMetadata, searchParamsIndicateDuplicateLanding } from "@/lib/seo/site";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; industry?: string; location?: string }>;
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

export default async function EttevottedPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "pages.companies" });
  const tUi = await getTranslations({ locale, namespace: "companies" });

  const q = firstString(sp.q).trim();
  const industry = firstString(sp.industry).trim();
  const location = firstString(sp.location).trim();

  const supabase = await createSupabaseServerClient();
  const { companies, industries, locations } = await loadPublicCompanies(supabase, {
    q,
    industry,
    location,
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
      <section className="pb-20 pt-2">
        <Container>
          {!companies.length ? (
            <EmptyState
              icon={Building2}
              title={q || industry || location ? tUi("emptyFiltered") : tUi("empty")}
            />
          ) : (
            <ul className="mx-auto grid max-w-4xl list-none gap-3 p-0 sm:gap-4">
              {companies.map((company) => (
                <li key={company.id}>
                  <CompanyCard company={company} verifiedLabel={tUi("verifiedBadge")} />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </>
  );
}
