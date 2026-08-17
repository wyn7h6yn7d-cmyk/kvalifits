/**
 * Copy helpers for future saved-search job alerts.
 *
 * Delivery is not wired: Resend is used for apply notifications only, and there
 * is no cron/queue that calls these functions. Keep UI copy honest until a
 * scheduler sets SAVED_SEARCH_ALERTS_DELIVERY_ENABLED.
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
