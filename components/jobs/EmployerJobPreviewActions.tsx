"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { buildPublishLifecycleDates, inferListingPackageDays } from "@/lib/jobs/jobLifecycle";
import { validateStoredJobForPublish } from "@/lib/jobs/jobPublishFromRow";
import { errorMessageFromUnknown } from "@/lib/utils";

type Props = {
  locale: string;
  jobId: string;
  status: string;
  job: Record<string, unknown>;
};

export function EmployerJobPreviewActions({ locale, jobId, status, job }: Props) {
  const t = useTranslations("jobs");
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function publish() {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthed"));

      const { data: employer, error: employerErr } = await supabase
        .from("employer_profiles")
        .select("company_name,contact_email,company_description,location,industry")
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (employerErr) throw employerErr;

      const companyName = (employer?.company_name ?? "").toString();
      const result = validateStoredJobForPublish({
        job,
        companyName,
        employer: employer ?? null,
        professionRequired: false,
      });
      if (!result.ok) {
        router.push(`/${locale}/account/employer/jobs/${jobId}/edit?publish=1`);
        return;
      }

      const deadline = (job.application_deadline ?? "").toString().slice(0, 10);
      const lifecycle = buildPublishLifecycleDates({
        packageDays: inferListingPackageDays(deadline),
        applicationDeadline: deadline || null,
      });
      const { error: updErr } = await supabase
        .from("job_posts")
        .update({
          status: "published",
          published_at: lifecycle.published_at,
          application_deadline: lifecycle.application_deadline,
          expires_at: lifecycle.expires_at,
        })
        .eq("id", jobId);
      if (updErr) throw updErr;
      router.push(`/${locale}/account/employer/jobs`);
      router.refresh();
    } catch (err) {
      setError(errorMessageFromUnknown(err, t("saveFailed")));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Button asChild variant="outline">
        <Link href={`/account/employer/jobs/${jobId}/edit`}>{t("edit")}</Link>
      </Button>
      {status !== "published" ? (
        <Button type="button" variant="primary" loading={loading} loadingText={t("saving")} onClick={() => void publish()}>
          {t("publishNow")}
        </Button>
      ) : null}
      {error ? <p className="w-full text-sm text-white/70">{error}</p> : null}
    </div>
  );
}
