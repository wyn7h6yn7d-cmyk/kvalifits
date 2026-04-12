import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { PageHero } from "@/components/site/PageHero";
import { JobsSearch } from "@/components/jobs/JobsSearch";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Job } from "@/components/jobs/types";

type Props = { params: Promise<{ locale: string }> };

// Always query Supabase at request time (session + RLS); avoids stale empty listings.
export const dynamic = "force-dynamic";

function normFacetValue(s: string) {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[\u2011\u2010\u2212]/g, "-");
}

function extractSummary(description: string | null | undefined) {
  const raw = (description ?? "").toString().trim();
  if (!raw) return undefined;

  const firstBlock = raw.split(/\n\s*\n/)[0]?.trim() ?? "";
  if (!firstBlock) return undefined;

  // EmployerNewJobForm prefixes summary like: "Kokkuvõte: ..." or "Summary: ..."
  const cleaned = firstBlock
    .replace(/^(Kokkuvõte|Summary)\s*:\s*/i, "")
    .trim();

  return cleaned || undefined;
}

function extractKeywordCandidates(text: string) {
  const tokens: string[] = [];
  const parts = text
    .split(/\n|,|;|\u2022|•|·|\/|\|/g)
    .map((p) => p.trim())
    .filter(Boolean);

  for (const p of parts) {
    const v = normFacetValue(p);
    if (!v) continue;
    if (v.length < 2) continue;
    // Avoid full sentences; keep "keyword-like" phrases.
    if (v.length > 36) continue;
    tokens.push(v);
  }
  return tokens;
}

function mapWorkType(raw: string, tJobs: (key: string) => string) {
  const v = raw.trim();
  if (!v) return undefined;
  if (v === "on_site") return tJobs("workTypeOnSite");
  if (v === "hybrid") return tJobs("workTypeHybrid");
  if (v === "remote") return tJobs("workTypeRemote");
  return v;
}

function mapJobType(raw: string, tJobs: (key: string) => string) {
  const v = raw.trim();
  if (!v) return undefined;
  if (v === "full_time") return tJobs("jobTypeFullTime");
  if (v === "part_time") return tJobs("jobTypePartTime");
  if (v === "contract") return tJobs("jobTypeContract");
  if (v === "internship") return tJobs("jobTypeInternship");
  return v;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.jobs" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ToodPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("pages.jobs");
  const tJobs = await getTranslations({ locale, namespace: "jobs" });
  const supabase = await createSupabaseServerClient();

  const { data: jobs } = await supabase
    .from("job_posts")
    .select(
      "id,title,location,job_type,work_type,short_summary,description,requirements,required_skills,keywords,certificate_requirements,salary_min,salary_max,salary_currency,employer_profile_id,status,created_at"
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(200);

  const employerIds = Array.from(
    new Set((jobs ?? []).map((j: any) => j.employer_profile_id).filter(Boolean))
  ) as string[];

  const { data: employers } = employerIds.length
    ? await supabase.from("employer_profiles").select("id,company_name").in("id", employerIds)
    : { data: [] as any[] };

  const nameByEmployerId = new Map((employers ?? []).map((e: any) => [e.id, e.company_name ?? "—"]));

  const mapped: Job[] = (jobs ?? []).map((j: any) => {
    const min = typeof j.salary_min === "number" ? j.salary_min : null;
    const max = typeof j.salary_max === "number" ? j.salary_max : null;
    const currency = (j.salary_currency ?? "EUR").toString();
    const salary =
      min || max
        ? `${min ? `${min}` : ""}${min && max ? "–" : ""}${max ? `${max}` : ""} ${currency}`
        : undefined;

    const jobType = mapJobType((j.job_type ?? "").toString(), tJobs);
    const workType = mapWorkType((j.work_type ?? "").toString(), tJobs);
    const type = [workType, jobType].filter(Boolean).join(" · ") || "—";

    const summary =
      (j.short_summary ?? "").toString().trim() || extractSummary(j.description);
    const keywordText = `${j.title ?? ""}\n${j.requirements ?? ""}\n${(j.keywords ?? []).join("\n")}`;
    const fromDbTags = [
      ...((j.keywords as string[] | null) ?? []).map((x) => normFacetValue(x)).filter(Boolean),
      ...((j.required_skills as string[] | null) ?? []).map((x) => normFacetValue(x)).filter(Boolean),
    ];
    const tags = Array.from(
      new Set([...fromDbTags, ...extractKeywordCandidates(keywordText)])
    ).slice(0, 12);

    const certReq = (j.certificate_requirements ?? "").toString().trim();
    const requiredCerts = certReq
      ? certReq
          .split(/[,;\n]/g)
          .map((s: string) => normFacetValue(s))
          .filter(Boolean)
          .slice(0, 8)
      : [];

    return {
      id: j.id,
      title: j.title,
      company: nameByEmployerId.get(j.employer_profile_id) ?? "—",
      location: j.location ?? "—",
      type,
      salary,
      workType,
      jobType,
      summary,
      createdAt: j.created_at ?? undefined,
      tags,
      requiredCerts,
      domains: [],
      languages: [],
    };
  });

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <PageHero
          eyebrow={t("heroEyebrow")}
          title={t("heroTitle")}
          subtitle={t("heroSubtitle")}
        />
        <JobsSearch jobs={mapped} />
      </main>
      <Footer />
    </div>
  );
}
