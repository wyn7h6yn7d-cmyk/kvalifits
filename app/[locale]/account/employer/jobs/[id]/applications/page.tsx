import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function EmployerJobApplicationsPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "jobs" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth/login`);

  const { role, nextPath } = await getRoleAndNextPath(locale);
  if (role !== "employer") redirect(`/${locale}/account`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  const { data: job, error: jobErr } = await supabase
    .from("job_posts")
    .select("id,title,created_by")
    .eq("id", id)
    .maybeSingle();
  if (jobErr) throw jobErr;
  if (!job) redirect(`/${locale}/account/employer`);
  if (job.created_by !== user.id) redirect(`/${locale}/account/employer`);

  const { data: applications, error: appErr } = await supabase
    .from("job_applications")
    .select("id,created_at,cover_letter,shared_profile")
    .eq("job_post_id", id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (appErr) throw appErr;

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell title={t("applicationsTitle")} subtitle={tNav("employerAreaSubtitle")} maxWidthClassName="max-w-3xl">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
              <div className="text-sm font-medium text-white/85">{t("applicationsForJob")}</div>
              <div className="mt-1 text-sm text-white/60">{job.title}</div>
            </div>

            {applications?.length ? (
              <div className="space-y-3">
                {applications.map((a: any) => {
                  const seeker = a.shared_profile?.seeker ?? {};
                  const email = (seeker.email ?? "—").toString();
                  const name = (seeker.full_name ?? "—").toString();
                  const phone = (seeker.phone ?? "—").toString();
                  const location = (seeker.location ?? "—").toString();
                  const cv = (seeker.cv_url ?? "").toString();
                  const createdAt = (a.created_at ?? "").toString();
                  return (
                    <div
                      key={a.id}
                      className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white/85">{name}</div>
                          <div className="mt-1 text-xs text-white/55">
                            {location} · {createdAt ? new Date(createdAt).toLocaleString() : "—"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-white/70">
                        <div>
                          <span className="text-white/55">{t("applicationsEmail")}:</span> <span>{email}</span>
                        </div>
                        <div>
                          <span className="text-white/55">{t("applicationsPhone")}:</span> <span>{phone}</span>
                        </div>
                        {cv ? (
                          <div className="truncate">
                            <span className="text-white/55">{t("applicationsCv")}:</span>{" "}
                            <a className="text-white/80 underline hover:text-white" href={cv} target="_blank" rel="noreferrer">
                              {cv}
                            </a>
                          </div>
                        ) : null}
                      </div>

                      {a.cover_letter ? (
                        <div className="mt-4">
                          <div className="text-xs font-medium tracking-wide text-white/55">{t("applicationsMessage")}</div>
                          <div className="mt-2 whitespace-pre-wrap rounded-2xl border border-white/[0.10] bg-white/[0.02] px-4 py-3 text-sm text-white/75">
                            {a.cover_letter}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-6 text-sm text-white/70">
                {t("noApplicationsYet")}
              </div>
            )}
          </div>
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}

