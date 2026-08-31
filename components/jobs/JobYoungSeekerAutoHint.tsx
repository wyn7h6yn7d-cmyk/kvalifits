"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import {
  evaluateJobSuitableForAges16_17,
  jobPassesYoungSeekerAutoEligibility,
} from "@/lib/employmentRules";
import {
  parseOptionalHours,
  timeOrNull,
  type JobWorkConditionsFormValue,
} from "@/components/jobs/JobWorkConditionsFields";
import { YoungSeekerJobBadge } from "@/components/jobs/YoungSeekerJobBadge";

type Props = {
  workConditions: JobWorkConditionsFormValue;
  jobType: string;
};

/**
 * Employer-facing read-only preview: badge is automatic from employment rules.
 * No checkbox — employers cannot manually assign the public badge.
 */
export function JobYoungSeekerAutoHint({ workConditions, jobType }: Props) {
  const t = useTranslations("jobs");

  const passes = useMemo(() => {
    return jobPassesYoungSeekerAutoEligibility({
      weeklyHours: parseOptionalHours(workConditions.weeklyHours),
      dailyHours: parseOptionalHours(workConditions.dailyHours),
      shiftStart: timeOrNull(workConditions.shiftStart),
      shiftEnd: timeOrNull(workConditions.shiftEnd),
      includesNightWork: workConditions.includesNightWork,
      isHazardousWork: workConditions.isHazardousWork,
      jobType,
    });
  }, [workConditions, jobType]);

  const check = useMemo(() => {
    if (passes) return null;
    return evaluateJobSuitableForAges16_17({
      weeklyHours: parseOptionalHours(workConditions.weeklyHours),
      dailyHours: parseOptionalHours(workConditions.dailyHours),
      shiftStart: timeOrNull(workConditions.shiftStart),
      shiftEnd: timeOrNull(workConditions.shiftEnd),
      includesNightWork: workConditions.includesNightWork,
      isHazardousWork: workConditions.isHazardousWork,
      jobType,
    });
  }, [passes, workConditions, jobType]);

  return (
    <div className="rounded-3xl border border-border bg-[#f8fafc] p-5 sm:p-6 space-y-3">
      <div>
        <div className="text-sm font-medium text-foreground/80">{t("youngSeekerAutoTitle")}</div>
        <div className="mt-1 text-sm leading-relaxed text-muted">{t("youngSeekerAutoHint")}</div>
      </div>

      {passes ? (
        <div className="space-y-2">
          <YoungSeekerJobBadge />
          <p className="text-xs leading-relaxed text-muted-2">{t("youngSeekerAutoWillShow")}</p>
        </div>
      ) : (
        <p className="text-xs leading-relaxed text-muted-2">
          {check?.blockingIssues.includes("missing_schedule_data")
            ? t("youngSeekerAutoNeedSchedule")
            : t("youngSeekerAutoNotYet")}
        </p>
      )}
    </div>
  );
}
