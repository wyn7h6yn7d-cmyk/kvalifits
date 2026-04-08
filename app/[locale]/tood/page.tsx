import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { PageHero } from "@/components/site/PageHero";
import { JobsSearch } from "@/components/jobs/JobsSearch";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Job } from "@/components/jobs/types";

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
  const supabase = await createSupabaseServerClient();

  const { data: jobs } = await supabase
    .from("job_posts")
    .select("id,title,location,job_type,work_type,salary_min,salary_max,salary_currency,employer_profile_id,status,created_at")
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

    const type = [j.job_type, j.work_type].filter(Boolean).join(" / ") || "—";

    return {
      id: j.id,
      title: j.title,
      company: nameByEmployerId.get(j.employer_profile_id) ?? "—",
      location: j.location ?? "—",
      type,
      salary,
      tags: [],
      requiredCerts: [],
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
