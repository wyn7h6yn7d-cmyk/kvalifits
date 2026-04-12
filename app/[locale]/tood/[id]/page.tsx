import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JobApplyForm } from "@/components/jobs/JobApplyForm";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "pages.jobs" });
  const supabase = await createSupabaseServerClient();

  const { data: jobRaw } = await supabase
    .from("job_posts")
    .select(
      "id,title,location,job_type,work_type,short_summary,description,requirements,requirement_lines,required_skills,keywords,certificate_requirements,employer_profile_id,status,created_at"
    )
    .eq("id", id)
    .maybeSingle();

  const job = jobRaw as any;
  if (!job || job.status !== "published") redirect(`/${locale}/tood`);

  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("company_name,location,website")
    .eq("id", job.employer_profile_id)
    .maybeSingle();

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:px-6">
          <div className="text-sm text-white/60">{t("heroEyebrow")}</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white/92">{job.title}</h1>
          <div className="mt-2 text-sm text-white/70">
            {(employer?.company_name ?? "—").toString()} · {(job.location ?? "—").toString()}
          </div>

          <div className="mt-8 grid gap-6">
            {(job.short_summary ?? "").toString().trim() ? (
              <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
                <div className="text-xs font-medium tracking-wide text-white/55">{t("summary")}</div>
                <div className="mt-2 text-sm leading-relaxed text-white/75 whitespace-pre-wrap">
                  {(job.short_summary ?? "").toString()}
                </div>
              </div>
            ) : null}
            <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
              <div className="text-sm font-medium text-white/85">{t("heroTitle")}</div>
              <div className="mt-3 space-y-4 text-sm leading-relaxed text-white/70">
                <div>
                  <div className="text-xs font-medium tracking-wide text-white/55">{t("heroSubtitle")}</div>
                  <div className="mt-1 whitespace-pre-wrap">{(job.description ?? "").toString()}</div>
                </div>
                <div>
                  <div className="text-xs font-medium tracking-wide text-white/55">{t("requirements")}</div>
                  {Array.isArray(job.requirement_lines) && job.requirement_lines.length ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-white/72">
                      {(job.requirement_lines as string[])
                        .filter(Boolean)
                        .map((line, i) => (
                          <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
                        ))}
                    </ul>
                  ) : (
                    <div className="mt-1 whitespace-pre-wrap">{(job.requirements ?? "").toString()}</div>
                  )}
                </div>
                {(job.certificate_requirements ?? "").toString().trim() ? (
                  <div>
                    <div className="text-xs font-medium tracking-wide text-white/55">{t("jobCertRequirements")}</div>
                    <div className="mt-1 whitespace-pre-wrap">
                      {(job.certificate_requirements ?? "").toString()}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <JobApplyForm locale={locale} jobPostId={job.id} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

