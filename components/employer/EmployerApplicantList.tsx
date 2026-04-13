import { getTranslations } from "next-intl/server";
import { CalendarDays, ChevronRight, MapPin } from "lucide-react";

import { Link } from "@/i18n/routing";
import { parseMatchBreakdown } from "@/lib/employer/parseMatchBreakdown";
import type { MatchBreakdown } from "@/lib/matching/calculateJobMatch";

import { cn } from "@/lib/utils";

type ApplicationRow = {
  id: string;
  created_at: string | null;
  match_score: number | null;
  match_breakdown: unknown;
  shared_profile: unknown;
};

function displayName(fullName: string | null | undefined) {
  const s = (fullName ?? "").trim();
  if (!s) return "—";
  const parts = s.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0]!;
  const first = parts.slice(0, -1).join(" ");
  const last = parts[parts.length - 1] ?? "";
  const initial = last.trim() ? `${last.trim()[0]!.toUpperCase()}.` : "";
  return initial ? `${first} ${initial}` : first;
}

function initialsFromName(fullName: string) {
  const parts = fullName.trim().split(/\s+/g).filter(Boolean);
  const first = parts[0]?.[0]?.toUpperCase() ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0]?.toUpperCase() ?? "") : "";
  return `${first}${last}` || "—";
}

function highlightLabel(highlights: string[] | undefined, t: (key: string) => string): string | null {
  const h = highlights?.[0];
  if (!h) return null;
  switch (h) {
    case "skillsStrong":
      return t("applicantHighlight_skillsStrong");
    case "skillsPartial":
      return t("applicantHighlight_skillsPartial");
    case "requirementsStrong":
      return t("applicantHighlight_requirementsStrong");
    case "requirementsPartial":
      return t("applicantHighlight_requirementsPartial");
    case "experienceFit":
      return t("applicantHighlight_experienceFit");
    case "locationFit":
      return t("applicantHighlight_locationFit");
    case "certificatesSignal":
      return t("applicantHighlight_certificatesSignal");
    case "certificatesStrong":
      return t("applicantHighlight_certificatesStrong");
    case "certificateGap":
      return t("applicantHighlight_certificateGap");
    case "roleAlignment":
      return t("applicantHighlight_roleAlignment");
    default:
      return null;
  }
}

/** One concise decision clue; prefers structured counts, then positive highlights. */
function pickSupportClue(
  bd: Partial<MatchBreakdown> | null,
  highlights: string[] | undefined,
  t: (key: string, values?: Record<string, number>) => string
): string | null {
  const reqT = bd?.requirementsTotal ?? 0;
  const reqM = bd?.requirementsMatched ?? 0;
  if (reqT > 0) {
    return t("applicantsClueRequirements", { matched: reqM, total: reqT });
  }
  const cs = bd?.certificate_slots_required ?? 0;
  const cm = bd?.certificate_slots_matched ?? 0;
  if (cs > 0 && cm > 0) {
    return t("applicantsClueCertificates", { matched: cm, total: cs });
  }
  const hl = highlights ?? [];
  if (hl.includes("locationFit")) return t("applicantsClueLocation");
  const skip = new Set(["certificateGap"]);
  const pick = hl.find((x) => !skip.has(x));
  return highlightLabel(pick ? [pick] : undefined, t);
}

export async function EmployerApplicantList({
  locale,
  jobPostId,
  applications,
}: {
  locale: string;
  jobPostId: string;
  applications: ApplicationRow[];
}) {
  const t = await getTranslations({ locale, namespace: "jobs" });

  const sorted = [...applications].sort((a, b) => {
    const sa = typeof a.match_score === "number" ? a.match_score : -1;
    const sb = typeof b.match_score === "number" ? b.match_score : -1;
    return sb - sa;
  });

  if (!sorted.length) {
    return (
      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] px-6 py-10 text-center sm:px-8">
        <div className="text-sm font-medium text-white/85">{t("noApplicationsYet")}</div>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/55">{t("applicantsEmptySubtitle")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[13px] leading-snug text-white/55">
        {t("applicantsSortedHint")}
      </p>

      <ul className="list-none space-y-3 p-0">
        {sorted.map((a, index) => {
          const seeker = (a.shared_profile as { seeker?: Record<string, unknown> } | null)?.seeker ?? {};
          const name = displayName((seeker.full_name as string | undefined) ?? null);
          const avatarUrl = ((seeker.avatar_url as string | undefined) ?? "").toString().trim();
          const profileTitle = ((seeker.profile_title as string | undefined) ?? "").trim() || "—";
          const location = ((seeker.location as string | undefined) ?? "").trim() || "—";
          const createdAt = (a.created_at ?? "").toString();
          const score = typeof a.match_score === "number" ? a.match_score : null;
          const bd = parseMatchBreakdown(a.match_breakdown);
          const clue = pickSupportClue(bd, bd?.highlights, t);
          const thinProfile = name === "—" || profileTitle === "—";
          const dateLabel = createdAt
            ? new Date(createdAt).toLocaleDateString(locale, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "—";

          const showRank = score != null && index < 5;
          const isTop = index === 0 && score != null;

          return (
            <li key={a.id}>
              <Link
                href={`/account/employer/jobs/${jobPostId}/applicants/${a.id}`}
                className={cn(
                  "group relative block overflow-hidden rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 shadow-none outline-none transition-[border-color,background-color,box-shadow,transform] duration-200 sm:p-6",
                  "hover:border-white/[0.17] hover:bg-white/[0.055] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_20px_50px_-38px_rgba(0,0,0,0.65)]",
                  "focus-visible:border-white/[0.20] focus-visible:ring-2 focus-visible:ring-violet-400/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "active:scale-[0.995]"
                )}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                >
                  <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
                  <div className="absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-fuchsia-500/8 blur-3xl" />
                </div>

                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-stretch sm:justify-between sm:gap-8">
                  {/* Mobile: score first for quick scan */}
                  <div
                    className={cn(
                      "order-1 flex flex-row items-center gap-4 sm:order-2 sm:flex-col sm:items-end sm:justify-between",
                      isTop ? "justify-between" : "justify-end"
                    )}
                  >
                    {isTop ? (
                      <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/90 sm:hidden">
                        {t("applicantsTopMatch")}
                      </span>
                    ) : null}
                    <ScoreBadge score={score} label={t("applicantsSuitability")} />
                  </div>

                  <div className="order-2 min-w-0 flex-1 space-y-3 sm:order-1">
                    <div className="flex flex-wrap items-start gap-3">
                      {showRank ? (
                        <span
                          className={cn(
                            "mt-0.5 inline-flex h-7 min-w-[1.75rem] shrink-0 items-center justify-center rounded-lg border px-2 text-[11px] font-semibold tabular-nums text-white/55",
                            index === 0
                              ? "border-violet-400/25 bg-violet-500/10 text-violet-100/90"
                              : "border-white/[0.10] bg-white/[0.04]"
                          )}
                          title={t("applicantsRankHint")}
                        >
                          {index + 1}
                        </span>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        {isTop ? (
                          <div className="mb-1 hidden sm:block">
                            <span className="inline-flex w-fit rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/90">
                              {t("applicantsTopMatch")}
                            </span>
                          </div>
                        ) : null}
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-2xl border border-white/[0.10] bg-white/[0.03] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]">
                            {avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold tracking-wide text-white/55">
                                {initialsFromName(name)}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-1">
                              <span className="text-[17px] font-semibold leading-snug tracking-tight text-white/95 sm:text-lg">
                                {name}
                              </span>
                              <span
                                className={cn(
                                  "text-sm leading-snug text-white/68",
                                  profileTitle === "—" && "text-white/40 italic"
                                )}
                              >
                                {profileTitle === "—" ? t("applicantsNoTitle") : profileTitle}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 text-[13px] text-white/52 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-white/35" aria-hidden />
                        <span className="min-w-0 text-white/65">{location === "—" ? t("applicantsNoLocation") : location}</span>
                      </span>
                      <span className="hidden h-1 w-1 shrink-0 rounded-full bg-white/20 sm:inline-block" aria-hidden />
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-white/35" aria-hidden />
                        <span>
                          {t("applicantsApplied")} {dateLabel}
                        </span>
                      </span>
                    </div>

                    {thinProfile ? (
                      <p className="text-[12px] leading-relaxed text-amber-200/65">{t("applicantsIncompleteHint")}</p>
                    ) : null}

                    {score == null ? (
                      <p className="text-[12px] leading-relaxed text-amber-200/70">{t("applicantsLegacyScore")}</p>
                    ) : null}

                    {clue ? (
                      <p className="border-l-2 border-violet-400/35 pl-3 text-[13px] leading-relaxed text-white/62">{clue}</p>
                    ) : null}

                    <div className="flex items-center gap-1.5 pt-1 text-[12px] font-medium text-white/40 transition-colors group-hover:text-white/55">
                      <span>{t("applicantsViewDetail")}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ScoreBadge({ score, label }: { score: number | null; label: string }) {
  const has = score != null;
  return (
    <div className="relative w-fit shrink-0 sm:w-[7.25rem]">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -inset-px rounded-2xl opacity-80 blur-[1px]",
          has ? "bg-gradient-to-br from-violet-400/25 via-white/[0.07] to-fuchsia-400/15" : "bg-white/[0.06]"
        )}
      />
      <div
        className={cn(
          "relative flex flex-col rounded-2xl border bg-gradient-to-b px-4 py-3.5 text-right shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset] sm:min-h-[5.75rem] sm:justify-center sm:py-4",
          has ? "border-white/[0.16] from-white/[0.11] to-black/35" : "border-white/[0.10] from-white/[0.06] to-black/40"
        )}
      >
        <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/45">{label}</span>
        <span
          className={cn(
            "mt-1 tabular-nums tracking-tight text-white",
            has ? "text-[2rem] font-semibold leading-none sm:text-[2.125rem]" : "text-xl font-medium text-white/45"
          )}
        >
          {has ? `${score}` : "—"}
          {has ? <span className="ml-0.5 text-lg font-semibold text-white/75">%</span> : null}
        </span>
        {has ? (
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-400/85 to-fuchsia-400/75 transition-[width] duration-300"
              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
