"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FitScoreExplain } from "@/components/jobs/FitScoreExplain";
import { JobSaveButton } from "@/components/jobs/JobSaveButton";
import { Link } from "@/i18n/routing";
import type { MatchExplanation } from "@/lib/matching/matchExplanation";
import { cn } from "@/lib/utils";
import {
  SITE_DARK_CARD,
  SITE_DARK_FOOTER_BAR,
  SITE_DARK_INSET,
} from "@/lib/site/publicPageLayout";

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
          SITE_DARK_FOOTER_BAR,
          "fixed inset-x-0 z-40 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden",
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
          <Button
            asChild
            variant="primary"
            className="h-12 min-w-0 flex-[1.15] px-3 text-center"
          >
            <a href={applyHref} onClick={applyClick}>
              {t("jobDetailApplyTopCta")}
            </a>
          </Button>
        </div>
      </div>
    );
  }

  const applyButton = acceptsApplications ? (
    <Button asChild variant="primary" className="w-full">
      <a href={applyHref} onClick={applyClick}>
        {t("jobDetailApplyTopCta")}
      </a>
    </Button>
  ) : (
    <div className={cn(SITE_DARK_INSET, "px-3 py-2.5 text-[0.9375rem] leading-[1.6] text-muted")}>
      {applyClosedBody}
      {applyUntilLabel ? <span className="mt-1 block font-medium text-foreground/80">{applyUntilLabel}</span> : null}
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
      <div className={cn(SITE_DARK_INSET, "p-4", className)}>
        {match ? <MatchLines match={match} /> : null}
        {showCreateProfileCta ? (
          <Link
            href={profileHref}
            className={cn(
              "text-base leading-[1.65] text-body underline-offset-4 hover:text-foreground hover:underline",
              match ? "mt-3 block" : "",
            )}
          >
            {t("jobDetailCreateProfileCta")}
          </Link>
        ) : null}
        {acceptsApplications ? (
          <Button
            asChild
            variant="primary"
            className={cn("w-full", match || showCreateProfileCta ? "mt-4" : "")}
          >
            <a href={applyHref} onClick={applyClick}>
              {t("jobDetailApplyTopCta")}
            </a>
          </Button>
        ) : (
          <div
            className={cn(
              SITE_DARK_INSET,
              "px-3 py-2.5 text-[0.9375rem] leading-[1.6] text-muted",
              match || showCreateProfileCta ? "mt-4" : "",
            )}
          >
            {applyClosedBody}
            {applyUntilLabel ? <span className="mt-1 block font-medium text-foreground/80">{applyUntilLabel}</span> : null}
          </div>
        )}
      </div>
    );
  }

  return (
    <aside
      className={cn(
        SITE_DARK_CARD,
        "p-5",
        className,
      )}
    >
      {match ? <MatchLines match={match} /> : null}
      {showCreateProfileCta ? (
        <Link
          href={profileHref}
          className="block text-base leading-[1.65] text-muted underline-offset-4 hover:text-foreground hover:underline"
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
