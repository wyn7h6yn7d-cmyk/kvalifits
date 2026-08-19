import * as Sentry from "@sentry/nextjs";

import { getSharedSentryOptions } from "@/lib/monitoring/sentryOptions";

Sentry.init({
  ...getSharedSentryOptions(),
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
