import * as Sentry from "@sentry/nextjs";

import { getBrowserSentryOptions } from "@/lib/monitoring/sentryOptions";

/**
 * Client Sentry: errors only.
 * Replay stays off; tracing sample rate is 0 to avoid BrowserTracing weight.
 * Tree-shaking flags in next.config further strip unused SDK code.
 */
Sentry.init({
  ...getBrowserSentryOptions(),
  integrations(integrations) {
    return integrations.filter((integration) => {
      const name = integration.name;
      return (
        name !== "Replay" &&
        name !== "ReplayCanvas" &&
        name !== "BrowserTracing" &&
        name !== "BrowserSession" &&
        name !== "Feedback"
      );
    });
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
