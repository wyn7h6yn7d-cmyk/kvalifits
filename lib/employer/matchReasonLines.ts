import type { ApplicationAnswers } from "@/lib/jobs/applicationAnswers";
import type { MatchBreakdown } from "@/lib/matching/calculateJobMatch";

export type MatchReasonStatus = "pass" | "partial" | "gap";

export type MatchReasonLine = {
  key: string;
  status: MatchReasonStatus;
};

type BuildArgs = {
  breakdown: Partial<MatchBreakdown> | null;
  answers?: Pick<ApplicationAnswers, "scheduleFits" | "availability_start"> | null;
  languages?: string[] | null;
  jobLanguageHints?: string[] | null;
};

function statusFromKey(key: string): MatchReasonStatus {
  if (key.endsWith("Gap")) return "gap";
  if (key.endsWith("Partial")) return "partial";
  return "pass";
}

/**
 * Short, scannable reasons for the match %. Prefers `reason_codes` from the scorer (v7+).
 */
export function buildMatchReasonLines(args: BuildArgs): MatchReasonLine[] {
  const bd = args.breakdown;
  if (!bd) return [];

  const fromCodes = Array.isArray(bd.reason_codes)
    ? bd.reason_codes.filter((x): x is string => typeof x === "string" && x.startsWith("matchReason"))
    : [];

  if (fromCodes.length) {
    return fromCodes.slice(0, 8).map((key) => ({ key, status: statusFromKey(key) }));
  }

  // Legacy fallback when reason_codes are missing.
  const lines: MatchReasonLine[] = [];
  const push = (key: string, status: MatchReasonStatus) => lines.push({ key, status });

  const certSlots = bd.certificate_slots_required ?? 0;
  if (certSlots > 0) {
    const raw = bd.certificate_raw ?? 0;
    if (raw >= 0.72) push("matchReasonCertPass", "pass");
    else if (raw >= 0.42) push("matchReasonCertPartial", "partial");
    else push("matchReasonCertGap", "gap");
  }

  const loc = bd.location_raw ?? 0;
  if (loc >= 0.72) push("matchReasonLocPass", "pass");
  else if (loc >= 0.45) push("matchReasonLocPartial", "partial");
  else push("matchReasonLocGap", "gap");

  if (args.answers?.scheduleFits === "yes") push("matchReasonSchedulePass", "pass");
  else if (args.answers?.scheduleFits === "partial") push("matchReasonSchedulePartial", "partial");
  else if (args.answers?.scheduleFits === "no") push("matchReasonScheduleGap", "gap");

  const exp = bd.experience_raw ?? 0;
  if (exp >= 0.75) push("matchReasonExpPass", "pass");
  else if (exp >= 0.45) push("matchReasonExpPartial", "partial");
  else push("matchReasonExpGap", "gap");

  const mandTotal = bd.requirementsMandatoryTotal ?? bd.requirementsTotal ?? 0;
  const mandRaw = bd.requirements_mandatory_raw;
  if (mandTotal > 0 && mandRaw !== undefined) {
    if (mandRaw >= 0.7) push("matchReasonMandReqPass", "pass");
    else if (mandRaw >= 0.35) push("matchReasonMandReqPartial", "partial");
    else push("matchReasonMandReqGap", "gap");
  }

  const sk = bd.skills_keywords_raw ?? 0;
  if (sk >= 0.72) push("matchReasonSkillsPass", "pass");
  else if (sk >= 0.38) push("matchReasonSkillsPartial", "partial");
  else push("matchReasonSkillsGap", "gap");

  const passes = lines.filter((l) => l.status === "pass");
  const rest = lines.filter((l) => l.status !== "pass");
  return [...passes, ...rest].slice(0, 8);
}
