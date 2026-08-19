import { createHash } from "node:crypto";

import type { Job } from "@/components/jobs/types";
import type { JobLifecycleDates } from "@/lib/jobs/jobLifecycle";
import { jobAcceptsApplications } from "@/lib/jobs/jobLifecycle";
import {
  jobMatchesSavedSearch,
  normalizeSavedSearchSnapshot,
  parseSavedSearchFrequency,
  type SavedSearchFrequency,
  type SavedSearchSnapshot,
} from "@/lib/jobs/savedJobSearches";
import { routing, type AppLocale } from "@/i18n/routing";

export const SAVED_SEARCH_ALERT_DAILY_MS = 24 * 60 * 60 * 1000;
export const SAVED_SEARCH_ALERT_WEEKLY_MS = 7 * SAVED_SEARCH_ALERT_DAILY_MS;

export type SavedSearchAlertJob = Job & JobLifecycleDates;

export type SavedSearchAlertPlanInput = {
  enabled: boolean;
  frequency: SavedSearchFrequency | string;
  last_notified_at: string | null;
  notify_after: string;
  locale: string;
  min_match_percent: number | null;
  matchingAvailable: boolean;
  alreadyNotifiedJobIds: ReadonlySet<string>;
  asOf?: Date;
};

export type SavedSearchAlertSkipReason = "disabled" | "not_due" | "no_new_jobs";

export type SavedSearchAlertPlan =
  | { kind: "skip"; reason: SavedSearchAlertSkipReason }
  | {
      kind: "deliver";
      jobs: SavedSearchAlertJob[];
      deliveryKey: string;
      locale: AppLocale;
      minMatchApplied: number | null;
    };

export function parseSavedSearchLocale(raw: unknown): AppLocale {
  const s = (raw ?? "").toString().trim();
  if ((routing.locales as readonly string[]).includes(s)) return s as AppLocale;
  return routing.defaultLocale;
}

export function effectiveSavedSearchMinMatch(args: {
  minMatchPercent: number | null;
  matchingAvailable: boolean;
}): number | null {
  if (!args.matchingAvailable) return null;
  return args.minMatchPercent;
}

export function savedSearchAlertIsDue(args: {
  enabled: boolean;
  frequency: SavedSearchFrequency | string;
  lastNotifiedAt: string | null;
  asOf?: Date;
}): boolean {
  if (!args.enabled) return false;
  const asOf = args.asOf ?? new Date();
  const frequency = parseSavedSearchFrequency(args.frequency);
  if (frequency === "immediate") return true;
  const last = Date.parse(args.lastNotifiedAt ?? "");
  if (!Number.isFinite(last)) return true;
  const elapsed = asOf.getTime() - last;
  if (frequency === "daily") return elapsed >= SAVED_SEARCH_ALERT_DAILY_MS;
  return elapsed >= SAVED_SEARCH_ALERT_WEEKLY_MS;
}

export function isJobEligibleForSavedSearchAlert(
  job: SavedSearchAlertJob,
  asOf: Date = new Date(),
): boolean {
  return jobAcceptsApplications(
    {
      status: job.status,
      published_at: job.publishedAt ?? job.published_at ?? null,
      application_deadline: job.applicationDeadline ?? job.application_deadline ?? null,
      expires_at: job.expires_at ?? null,
    },
    asOf,
  );
}

export function selectJobsForSavedSearchAlert(args: {
  jobs: readonly SavedSearchAlertJob[];
  snapshot: SavedSearchSnapshot;
  minMatchPercent: number | null;
  matchingAvailable: boolean;
  notifyAfterIso: string;
  alreadyNotifiedJobIds: ReadonlySet<string>;
  asOf?: Date;
}): SavedSearchAlertJob[] {
  const asOf = args.asOf ?? new Date();
  const snapshot = normalizeSavedSearchSnapshot(args.snapshot);
  const minMatch = effectiveSavedSearchMinMatch({
    minMatchPercent: args.minMatchPercent,
    matchingAvailable: args.matchingAvailable,
  });
  const after = Date.parse(args.notifyAfterIso);
  const afterMs = Number.isFinite(after) ? after : 0;

  return args.jobs.filter((job) => {
    if (!job?.id) return false;
    if (args.alreadyNotifiedJobIds.has(job.id)) return false;
    if (!isJobEligibleForSavedSearchAlert(job, asOf)) return false;
    if (!jobMatchesSavedSearch(job, snapshot, minMatch)) return false;
    const published = Date.parse(job.publishedAt ?? job.createdAt ?? job.published_at ?? "");
    if (Number.isFinite(published) && published <= afterMs) return false;
    return true;
  });
}

export function savedSearchAlertDeliveryKey(jobIds: readonly string[]): string {
  const ids = [...new Set(jobIds.map((id) => id.trim()).filter(Boolean))].sort();
  return createHash("sha256").update(ids.join(",")).digest("hex").slice(0, 32);
}

export function planSavedSearchAlert(
  input: SavedSearchAlertPlanInput,
  jobs: readonly SavedSearchAlertJob[],
  snapshot: SavedSearchSnapshot,
): SavedSearchAlertPlan {
  if (!input.enabled) return { kind: "skip", reason: "disabled" };
  if (
    !savedSearchAlertIsDue({
      enabled: input.enabled,
      frequency: input.frequency,
      lastNotifiedAt: input.last_notified_at,
      asOf: input.asOf,
    })
  ) {
    return { kind: "skip", reason: "not_due" };
  }

  const matchingAvailable = Boolean(input.matchingAvailable);
  const selected = selectJobsForSavedSearchAlert({
    jobs,
    snapshot,
    minMatchPercent: input.min_match_percent,
    matchingAvailable,
    notifyAfterIso: input.notify_after,
    alreadyNotifiedJobIds: input.alreadyNotifiedJobIds,
    asOf: input.asOf,
  });
  if (!selected.length) return { kind: "skip", reason: "no_new_jobs" };

  return {
    kind: "deliver",
    jobs: selected,
    deliveryKey: savedSearchAlertDeliveryKey(selected.map((j) => j.id)),
    locale: parseSavedSearchLocale(input.locale),
    minMatchApplied: effectiveSavedSearchMinMatch({
      minMatchPercent: input.min_match_percent,
      matchingAvailable,
    }),
  };
}

export function savedSearchAlertsEmailEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.SAVED_SEARCH_ALERTS_EMAIL === "1" && Boolean((env.RESEND_API_KEY ?? "").trim());
}

export function cronBearerAuthorized(
  authorizationHeader: string | null | undefined,
  secret: string | null | undefined,
): boolean {
  const expected = (secret ?? "").trim();
  const header = (authorizationHeader ?? "").trim();
  if (!expected || !header) return false;
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return false;
  const got = header.slice(prefix.length).trim();
  if (got.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= got.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
