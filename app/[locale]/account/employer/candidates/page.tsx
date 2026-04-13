import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";

type Props = { params: Promise<{ locale: string }> };

function getPublicDisplayName(fullName: string | null) {
  const s = (fullName ?? "").trim();
  if (!s) return "—";
  const parts = s.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0]!;
  const first = parts.slice(0, -1).join(" ");
  const last = parts[parts.length - 1] ?? "";
  const initial = last.trim() ? `${last.trim()[0]!.toUpperCase()}.` : "";
  return initial ? `${first} ${initial}` : first;
}

function formatIsoDate(iso: string) {
  const s = iso.trim();
  // Expected: YYYY-MM-DD or ISO timestamp; MVP: keep it stable and locale-agnostic.
  return s.length >= 10 ? s.slice(0, 10) : s;
}

export default async function EmployerCandidatesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const tOnboarding = await getTranslations({ locale, namespace: "onboarding" });
  const tEmployer = await getTranslations({ locale, namespace: "employer" });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth/login`);

  const { role, nextPath } = await getRoleAndNextPath(locale);
  if (role !== "employer") redirect(`/${locale}/account`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  // Privacy-by-default MVP:
  // - only "discoverable" profiles (profile_visible = true)
  // - only profiles with at least one complete-enough certificate row OR explicit B-category license flag
  // - select only minimal summary fields (no email/phone/uploads)
  const [certRes, bLicRes] = await Promise.all([
    supabase
      .from("seeker_certificates")
      // select required certificate fields for completeness checks; not rendered to employers
      .select("user_id, certificate_name, certificate_issuer, certificate_valid_from, certificate_valid_until")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("seeker_profiles")
      .select("user_id")
      .eq("profile_visible", true)
      .eq("has_b_category_drivers_license", true)
      .limit(300),
  ]);

  const certRows = certRes.data;
  const certErr = certRes.error;
  const bLicenseRows = bLicRes.data;
  const bLicErr = bLicRes.error;

  function nonEmpty(v: unknown) {
    return typeof v === "string" && v.trim().length > 0;
  }

  const certByUser = new Map<string, { count: number; latestValidUntil: string | null }>();
  for (const row of certRows ?? []) {
    const userId = (row as { user_id?: string }).user_id;
    if (!userId) continue;

    const r = row as {
      certificate_name?: string | null;
      certificate_issuer?: string | null;
      certificate_valid_from?: string | null;
      certificate_valid_until?: string | null;
    };

    // Discovery rule: only count "complete enough" certificates (number is optional in DB/UI).
    if (
      !nonEmpty(r.certificate_name) ||
      !nonEmpty(r.certificate_issuer) ||
      !nonEmpty(r.certificate_valid_from) ||
      !nonEmpty(r.certificate_valid_until)
    ) {
      continue;
    }

    const v = r.certificate_valid_until ?? null;
    const prev = certByUser.get(userId);
    if (!prev) {
      certByUser.set(userId, { count: 1, latestValidUntil: v });
      continue;
    }
    const latest =
      !prev.latestValidUntil || (v && new Date(v).getTime() > new Date(prev.latestValidUntil).getTime())
        ? v
        : prev.latestValidUntil;
    certByUser.set(userId, { count: prev.count + 1, latestValidUntil: latest });
  }

  const candidateUserIdSet = new Set<string>(certByUser.keys());
  for (const row of bLicenseRows ?? []) {
    const uid = (row as { user_id?: string }).user_id;
    if (uid) candidateUserIdSet.add(uid);
  }
  const candidateUserIds = Array.from(candidateUserIdSet).slice(0, 200);

  const { data: seekers, error } = candidateUserIds.length
    ? await supabase
        .from("seeker_profiles")
        // select minimal summary fields; include "about" only for completeness filtering (not rendered)
        .select("id, user_id, full_name, location, experience_level, skills, profile_title, about, profile_visible, updated_at")
        .eq("profile_visible", true)
        .in("user_id", candidateUserIds)
        .not("full_name", "is", null)
        .not("location", "is", null)
        .not("experience_level", "is", null)
        .order("updated_at", { ascending: false })
        .limit(50)
    : { data: [], error: null };

  const discoverableSeekers =
    (seekers ?? []).filter((s) => {
      const skills = (s as { skills?: string[] | null }).skills ?? [];
      const about = (s as { about?: string | null }).about ?? "";
      return Array.isArray(skills) && skills.length >= 1 && nonEmpty(about);
    }) ?? [];

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell title={t("candidates")} subtitle={t("candidatesSubtitle")} maxWidthClassName="max-w-3xl">
          {certErr || bLicErr || error ? (
            <div className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
              {tOnboarding("unknownError")}
            </div>
          ) : null}

          {!discoverableSeekers?.length ? (
            <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-6 text-sm text-white/70">
              {tEmployer("noCandidatesYet")}
            </div>
          ) : (
            <div className="space-y-3">
              {discoverableSeekers.map((s) => (
                <div
                  key={s.id}
                  className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-white/85">
                        {getPublicDisplayName(s.full_name)}
                      </div>
                      <div className="mt-1 text-xs text-white/55">
                        {(s.profile_title || "").trim() ? s.profile_title : s.experience_level}{" "}
                        {s.location ? <span className="text-white/45">·</span> : null}{" "}
                        {s.location}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/[0.10] bg-white/[0.03] px-3 py-1 text-xs text-white/70">
                      {(certByUser.get(s.user_id)?.count ?? 0) >= 1 ? tEmployer("certificate") : "—"}
                      {(certByUser.get(s.user_id)?.count ?? 0) > 1
                        ? ` +${(certByUser.get(s.user_id)?.count ?? 0) - 1}`
                        : ""}
                    </span>
                    {certByUser.get(s.user_id)?.latestValidUntil ? (
                      <span className="rounded-full border border-white/[0.10] bg-white/[0.03] px-3 py-1 text-xs text-white/60">
                        {tEmployer("validUntil")} {formatIsoDate(certByUser.get(s.user_id)!.latestValidUntil!)}
                      </span>
                    ) : null}
                  </div>

                  {s.skills?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {s.skills.slice(0, 6).map((skill: string) => (
                        <span
                          key={skill}
                          className="rounded-full border border-white/[0.10] bg-white/[0.03] px-3 py-1 text-xs text-white/70"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}

