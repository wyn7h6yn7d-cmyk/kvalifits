"use client";

import { useTranslations } from "next-intl";

import { FitScoreExplain } from "@/components/jobs/FitScoreExplain";
import { JobSaveButton } from "@/components/jobs/JobSaveButton";
import { Link } from "@/i18n/routing";
import type { MatchExplanation } from "@/lib/matching/matchExplanation";
import { cn } from "@/lib/utils";

export type JobDetailMatchStats = {
  score: number;
  reqsFilled: number | null;
  reqsTotal: number | null;
  mandFilled: number | null;
  mandTotal: number | null;
  recFilled: number | null;
  recTotal: number | null;
  explanation: MatchExplanation | null;
};

type Props = {
  jobId: string;
  initialSaved: boolean;
  canSave: boolean;
  acceptsApplications: boolean;
  applyHref?: string;
  match: JobDetailMatchStats | null;
  showCreateProfileCta: boolean;
  profileHref: string;
  applyClosedBody: string;
  applyUntilLabel: string | null;
  variant: "sidebar" | "mobileBar" | "inline";
  className?: string;
};

function MatchLines({ match }: { match: JobDetailMatchStats }) {
  const t = useTranslations("jobs");
  return (
    <FitScoreExplain
      score={match.score}
      explanation={match.explanation}
      label={t("quickApplyFit")}
      showCountsWhenCollapsed
    />
  );
}

export function JobDetailApplyPanel({
  jobId,
  initialSaved,
  canSave,
  acceptsApplications,
  applyHref = "#kandideeri",
  match,
  showCreateProfileCta,
  profileHref,
  applyClosedBody,
  applyUntilLabel,
  variant,
  className,
}: Props) {
  const t = useTranslations("jobs");

  const applyClick = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("kvalifits:open-apply"));
    }
  };

  if (variant === "mobileBar") {
    if (!acceptsApplications) return null;
    return (
      <div
        className={cn(
          "fixed inset-x-0 z-40 border-t border-white/[0.10] bg-[#0c0c10] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden",
          className,
        )}
        style={{ bottom: "var(--site-bottom-nav-offset, 0px)" }}
      >
        <div className="flex items-stretch gap-2">
          {canSave ? (
            <JobSaveButton
              jobId={jobId}
              initialSaved={initialSaved}
              variant="labeled"
              unsavedLabel={t("jobDetailSaveCta")}
              savedLabel={t("jobDetailSavedCta")}
              className="h-12 min-w-0 flex-1 whitespace-normal px-3 text-center"
            />
          ) : null}
          <a
            href={applyHref}
            onClick={applyClick}
            className="flex h-12 min-w-0 flex-[1.15] items-center justify-center rounded-xl bg-white px-3 text-center text-[15px] font-semibold leading-tight text-black transition hover:bg-white/90"
          >
            {t("jobDetailApplyTopCta")}
          </a>
        </div>
      </div>
    );
  }

  const applyButton = acceptsApplications ? (
    <a
      href={applyHref}
      onClick={applyClick}
      className="flex h-11 w-full items-center justify-center rounded-xl bg-white text-sm font-semibold text-black transition hover:bg-white/90"
    >
      {t("jobDetailApplyTopCta")}
    </a>
  ) : (
    <div className="rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 py-2.5 text-[13px] leading-relaxed text-white/65">
      {applyClosedBody}
      {applyUntilLabel ? <span className="mt-1 block font-medium text-white/80">{applyUntilLabel}</span> : null}
    </div>
  );

  const saveButton = canSave ? (
    <JobSaveButton
      jobId={jobId}
      initialSaved={initialSaved}
      variant="labeled"
      unsavedLabel={t("jobDetailSaveCta")}
      savedLabel={t("jobDetailSavedCta")}
      className="h-11 w-full rounded-xl"
    />
  ) : null;

  if (variant === "inline") {
    return (
      <div className={cn("rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4", className)}>
        {match ? <MatchLines match={match} /> : null}
        {showCreateProfileCta ? (
          <Link
            href={profileHref}
            className={cn(
              "text-sm leading-relaxed text-white/70 underline-offset-4 hover:text-white hover:underline",
              match ? "mt-3 block" : "",
            )}
          >
            {t("jobDetailCreateProfileCta")}
          </Link>
        ) : null}
        {acceptsApplications ? (
          <a
            href={applyHref}
            onClick={applyClick}
            className={cn(
              "flex h-11 w-full items-center justify-center rounded-xl bg-white text-sm font-semibold text-black transition hover:bg-white/90",
              match || showCreateProfileCta ? "mt-4" : "",
            )}
          >
            {t("jobDetailApplyTopCta")}
          </a>
        ) : (
          <div
            className={cn(
              "rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 py-2.5 text-[13px] leading-relaxed text-white/65",
              match || showCreateProfileCta ? "mt-4" : "",
            )}
          >
            {applyClosedBody}
            {applyUntilLabel ? <span className="mt-1 block font-medium text-white/80">{applyUntilLabel}</span> : null}
          </div>
        )}
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-[#141416] p-5",
        className,
      )}
    >
      {match ? <MatchLines match={match} /> : null}
      {showCreateProfileCta ? (
        <Link
          href={profileHref}
          className="block text-sm leading-relaxed text-white/68 underline-offset-4 hover:text-white/90 hover:underline"
        >
          {t("jobDetailCreateProfileCta")}
        </Link>
      ) : null}
      <div className={cn("grid gap-2", match || showCreateProfileCta ? "mt-5" : "")}>
        {applyButton}
        {saveButton}
      </div>
    </aside>
  );
}
