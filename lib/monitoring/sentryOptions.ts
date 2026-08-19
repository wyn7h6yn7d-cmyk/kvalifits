import type { ErrorEvent } from "@sentry/core";

import { scrubSentryEvent } from "@/lib/monitoring/scrub";

export function sentryDsn(): string | undefined {
  const dsn = (process.env.NEXT_PUBLIC_SENTRY_DSN ?? "").trim();
  return dsn || undefined;
}

export function sentryEnvironment(): string {
  return (
    process.env.NEXT_PUBLIC_VERCEL_ENV ||
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV ||
    "development"
  );
}

export function sentryRelease(): string | undefined {
  const sha =
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA;
  return sha ? `kvalifits@${sha}` : undefined;
}

export function sentryEnabled(): boolean {
  return Boolean(sentryDsn()) && process.env.NODE_ENV !== "test";
}

export function tracesSampleRateForEnv(environment: string): number {
  if (environment === "production") return 0.1;
  if (environment === "preview") return 0.2;
  return 0;
}

export function getSharedSentryOptions() {
  const environment = sentryEnvironment();
  return {
    dsn: sentryDsn(),
    enabled: sentryEnabled(),
    environment,
    release: sentryRelease(),
    sendDefaultPii: false,
    enableLogs: false,
    tracesSampleRate: tracesSampleRateForEnv(environment),
    sampleRate: 1,
    maxBreadcrumbs: 30,
    beforeSend(event: ErrorEvent): ErrorEvent {
      return scrubSentryEvent(event);
    },
  };
}
