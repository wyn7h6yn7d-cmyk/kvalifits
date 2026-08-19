import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ExternalLink, Globe, MapPin } from "lucide-react";

import { Container } from "@/components/ui/container";
import { CompanyActiveJobs } from "@/components/companies/CompanyActiveJobs";
import { CompanyLogo } from "@/components/companies/CompanyLogo";
import { CompanyVerifiedBadge } from "@/components/employer/CompanyVerificationBadge";
import {
  buildCompanyMetadata,
  buildCompanySeoDescription,
  buildCompanySeoTitle,
  companyCanonicalPath,
} from "@/lib/companies/companySeo";
import { loadActiveJobsForPublicCompany, loadPublicCompanyBySlug } from "@/lib/companies/loadPublicCompany";
import { absoluteUrl, jsonLdScriptHtml, noindexLocalizedMetadata } from "@/lib/seo/site";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const supabase = await createSupabaseServerClient();
  const company = await loadPublicCompanyBySlug(supabase, slug);
  if (!company) {
    return noindexLocalizedMetadata({
      locale,
      path: `/ettevotted/${slug}`,
      title: t("companyMissingTitle"),
      description: t("companyMissingDescription"),
    });
  }
  const title = buildCompanySeoTitle(locale, company, t("companyFallbackName"));
  const description = buildCompanySeoDescription(locale, company);
  return buildCompanyMetadata({ locale, company, title, description });
}

export default async function CompanyProfilePage({ params }: Props) {
  const { locale, slug } = await params;
  const tUi = await getTranslations({ locale, namespace: "companies" });
  const tJobs = await getTranslations({ locale, namespace: "jobs" });
  const supabase = await createSupabaseServerClient();
  const company = await loadPublicCompanyBySlug(supabase, slug);
  if (!company) notFound();

  const jobs = await loadActiveJobsForPublicCompany(supabase, company.id, locale, (key) =>
    tJobs(key as never),
  );
  const pageUrl = absoluteUrl(locale, companyCanonicalPath(company.slug));

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    url: pageUrl,
    ...(company.logoUrl ? { logo: company.logoUrl } : {}),
    ...(company.website ? { sameAs: [company.website] } : {}),
    ...(company.description ? { description: company.description } : {}),
    ...(company.location
      ? { address: { "@type": "PostalAddress", addressLocality: company.location } }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScriptHtml(jsonLd) }} />
      <section className="border-b border-white/[0.06] pb-10 pt-20 sm:pt-24">
        <Container>
          <div className="mx-auto max-w-3xl">
            <div className="flex gap-4 sm:gap-5">
              <CompanyLogo url={company.logoUrl} name={company.name} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {company.name}
                  </h1>
                  {company.verified ? <CompanyVerifiedBadge label={tUi("verifiedBadge")} /> : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-white/60">
                  {company.location ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-white/35" aria-hidden />
                      {company.location}
                    </span>
                  ) : null}
                  {company.industry ? <span>{company.industry}</span> : null}
                  {company.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-white/70 hover:text-white hover:underline"
                    >
                      <Globe className="h-4 w-4 text-white/35" aria-hidden />
                      {tUi("website")}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            {company.description ? (
              <div className="mt-8">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
                  {tUi("aboutTitle")}
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-white/72">
                  {company.description}
                </p>
              </div>
            ) : null}

            <CompanyActiveJobs
              jobs={jobs}
              title={tUi("activeJobsTitle")}
              empty={tUi("activeJobsEmpty")}
              openJob={tUi("openJob")}
            />
          </div>
        </Container>
      </section>
    </>
  );
}
