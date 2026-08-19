/**
 * Copy helpers for saved-search job alerts (in-app + optional email).
 * Email is only sent when the worker sees Resend configured and SAVED_SEARCH_ALERTS_EMAIL=1.
 */

export type SavedSearchAlertCopyValues = {
  count: number;
  threshold: number;
};

/** next-intl key under namespace `savedSearches`. */
export const SAVED_SEARCH_ALERT_MESSAGE_KEY = "alertNewJobs" as const;
export const SAVED_SEARCH_ALERT_MESSAGE_KEY_NO_THRESHOLD = "alertNewJobsNoThreshold" as const;

export function savedSearchAlertMessageKey(minMatchPercent: number | null) {
  return minMatchPercent == null
    ? SAVED_SEARCH_ALERT_MESSAGE_KEY_NO_THRESHOLD
    : SAVED_SEARCH_ALERT_MESSAGE_KEY;
}

export function savedSearchAlertMessageValues(
  newJobCount: number,
  minMatchPercent: number | null,
): { count: number; threshold?: number } {
  const count = Math.max(0, Math.floor(newJobCount));
  if (minMatchPercent == null) return { count };
  return { count, threshold: minMatchPercent };
}
