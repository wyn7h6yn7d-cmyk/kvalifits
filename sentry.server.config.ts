import * as Sentry from "@sentry/nextjs";

import { getSharedSentryOptions } from "@/lib/monitoring/sentryOptions";

Sentry.init(getSharedSentryOptions());
