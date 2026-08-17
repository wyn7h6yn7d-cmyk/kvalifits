/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth/AuthShell";
import { SeekerSavedSearchesList } from "@/components/account/SeekerSavedSearchesList";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import {
  normalizeSavedSearchFilters,
  parseMinMatchPercent,
  parseSavedSearchFrequency,
  type SavedJobSearchRow,
} from "@/lib/jobs/savedJobSearches";

type Props = { params: Promise<{ locale: string }> };

export const dynamic = "force-dynamic";

export default async function SeekerNotificationsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "savedSearches" });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);

  const { role, nextPath } = await getRoleAndNextPath(locale);
  if (role !== "seeker") redirect(`/${locale}/account`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  const { data, error } = await supabase
    .from("saved_job_searches")
    .select(
      "id,seeker_user_id,name,query,filters,require_public_salary,min_match_percent,frequency,enabled,locale,search_fingerprint,notify_after,last_notified_at,created_at,updated_at",
    )
    .eq("seeker_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const missing = Boolean(error && /saved_job_searches|schema cache|does not exist/i.test(error.message ?? ""));
  if (error && !missing) throw error;

  const searches: SavedJobSearchRow[] = ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    seeker_user_id: row.seeker_user_id,
    name: (row.name ?? "").toString(),
    query: (row.query ?? "").toString(),
    filters: normalizeSavedSearchFilters(row.filters),
    require_public_salary: Boolean(row.require_public_salary),
    min_match_percent: parseMinMatchPercent(row.min_match_percent),
    frequency: parseSavedSearchFrequency(row.frequency),
    enabled: row.enabled !== false,
    locale: (row.locale ?? locale).toString(),
    search_fingerprint: (row.search_fingerprint ?? "").toString(),
    notify_after: row.notify_after ?? row.created_at,
    last_notified_at: row.last_notified_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
  }));

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")} maxWidthClassName="max-w-3xl">
          <SeekerSavedSearchesList searches={searches} />
        </AuthShell>
  );
}
