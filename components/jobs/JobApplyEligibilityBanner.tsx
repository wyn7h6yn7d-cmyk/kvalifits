"use client";

import { useTranslations } from "next-intl";

import {
  eligibilityIssueMessageParams,
  type EligibilityIssueCode,
} from "@/lib/employmentRules";
import {
  applyEligibilityIssuesForDisplay,
  applyEligibilityLegalDetailCodes,
  type ApplyEligibilityIssue,
  type ApplyEligibilityResult,
  type ApplyEligibilityStatus,
} from "@/lib/jobs/evaluateApplyEligibility";
import { cn } from "@/lib/utils";

type Props = {
  result: ApplyEligibilityResult;
  className?: string;
};

function statusTone(status: ApplyEligibilityStatus) {
  if (status === "eligible") {
    return "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100/90";
  }
  if (status === "attention") {
    return "border-amber-400/20 bg-amber-400/[0.06] text-amber-100/90";
  }
  return "border-rose-400/20 bg-rose-400/[0.06] text-rose-100/90";
}

function issueLabel(code: ApplyEligibilityIssue["code"], t: (key: string) => string) {
  switch (code) {
    case "legal_schedule_not_suitable":
      return t("applyEligibilityIssue_legal_schedule_not_suitable");
    case "legal_needs_review":
      return t("applyEligibilityIssue_legal_needs_review");
    case "missing_mandatory_certificates":
      return t("applyEligibilityIssue_missing_mandatory_certificates");
    case "partial_mandatory_certificates":
      return t("applyEligibilityIssue_partial_mandatory_certificates");
    case "missing_mandatory_requirements":
      return t("applyEligibilityIssue_missing_mandatory_requirements");
    case "partial_mandatory_requirements":
      return t("applyEligibilityIssue_partial_mandatory_requirements");
    case "missing_recommended_requirements":
      return t("applyEligibilityIssue_missing_recommended_requirements");
    case "workload_mismatch":
      return t("applyEligibilityIssue_workload_mismatch");
    case "workload_incompatible":
      return t("applyEligibilityIssue_workload_incompatible");
    case "hours_outside_preference":
      return t("applyEligibilityIssue_hours_outside_preference");
    case "hours_incompatible":
      return t("applyEligibilityIssue_hours_incompatible");
    case "schedule_does_not_fit":
      return t("applyEligibilityIssue_schedule_does_not_fit");
    case "schedule_partial_fit":
      return t("applyEligibilityIssue_schedule_partial_fit");
    case "availability_late":
      return t("applyEligibilityIssue_availability_late");
    default:
      return "";
  }
}

const LEGAL_DETAIL_CODES: EligibilityIssueCode[] = [
  "missing_schedule_data",
  "missing_learning_obligation",
  "daily_hours_exceeded",
  "weekly_hours_exceeded",
  "shift_outside_allowed_window",
  "night_work_not_allowed",
  "hazardous_work_restricted",
  "full_time_with_learning_obligation",
  "full_time_for_age_band",
];

function legalDetailLabel(
  code: EligibilityIssueCode,
  params: ReturnType<typeof eligibilityIssueMessageParams>,
  t: (key: string, values?: Record<string, string | number>) => string
) {
  if (LEGAL_DETAIL_CODES.includes(code)) {
    return t(`minorEligibilityIssue.${code}`, params);
  }
  return t("minorEligibilityIssue.generic", params);
}

export function JobApplyEligibilityBanner({ result, className }: Props) {
  const t = useTranslations("jobs");
  const title =
    result.status === "eligible"
      ? t("applyEligibilityEligible")
      : result.status === "attention"
        ? t("applyEligibilityAttention")
        : t("applyEligibilityBlocked");

  const detailCodes = applyEligibilityLegalDetailCodes(result);
  const params = result.legalDetail
    ? eligibilityIssueMessageParams(result.legalDetail.limits)
    : null;

  const legalLines =
    detailCodes.length && params
      ? detailCodes
          .map((code) => legalDetailLabel(code, params, t))
          .filter(Boolean)
      : applyEligibilityIssuesForDisplay(result)
          .filter((i) => i.severity === "block" || i.code === "legal_needs_review")
          .map((i) => issueLabel(i.code, t))
          .filter(Boolean);

  const otherLines = applyEligibilityIssuesForDisplay(result)
    .filter((i) => i.severity !== "block" && i.code !== "legal_needs_review")
    .map((i) => issueLabel(i.code, t))
    .filter(Boolean);

  return (
    <div className={cn("rounded-3xl border px-4 py-3.5 sm:px-5 sm:py-4", statusTone(result.status), className)}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">
        {result.legalBlock || detailCodes.length
          ? t("applyEligibilityLegalLabel")
          : t("applyEligibilityLabel")}
      </div>
      <div className="mt-1 text-sm font-semibold leading-snug">{title}</div>
      {legalLines.length ? (
        <ul className="mt-2.5 list-none space-y-1.5 p-0 text-[13px] leading-snug opacity-90">
          {legalLines.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="shrink-0 opacity-70" aria-hidden>
                –
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {otherLines.length ? (
        <ul className="mt-2.5 list-none space-y-1.5 p-0 text-[13px] leading-snug opacity-90">
          {otherLines.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="shrink-0 opacity-70" aria-hidden>
                {result.status === "eligible" ? "·" : "–"}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {!legalLines.length && !otherLines.length && result.status === "eligible" ? (
        <p className="mt-1.5 text-[13px] leading-snug opacity-80">{t("applyEligibilityEligibleHint")}</p>
      ) : null}
      {result.legalBlock ? (
        <p className="mt-2.5 text-[11px] leading-snug opacity-65">{t("applyEligibilityBlockedHint")}</p>
      ) : (
        <p className="mt-2.5 text-[11px] leading-snug opacity-65">{t("applyEligibilityCanStillApply")}</p>
      )}
    </div>
  );
}
