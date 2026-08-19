import * as Sentry from "@sentry/nextjs";

export type MonitoringArea =
  | "api"
  | "client"
  | "job_application"
  | "auth"
  | "email"
  | "storage";

type ExtraValue = string | number | boolean | null | undefined;

export type ReportContext = {
  area: MonitoringArea;
  code?: string;
  extras?: Record<string, ExtraValue>;
};

function withReportScope(context: ReportContext, fn: () => void): void {
  try {
    Sentry.withScope((scope) => {
      scope.setTag("area", context.area);
      if (context.code) scope.setTag("code", context.code);
      if (context.extras) {
        for (const [key, value] of Object.entries(context.extras)) {
          if (value === undefined) continue;
          scope.setExtra(key, value);
        }
      }
      fn();
    });
  } catch {
    // Monitoring must never break the product path.
  }
}

/** Capture an unexpected exception. Never throws. Do not pass PII in extras. */
export function reportException(error: unknown, context: ReportContext): void {
  withReportScope(context, () => {
    Sentry.captureException(error);
  });
}

/** Capture an unexpected condition without an Error object. Never throws. */
export function reportMessage(message: string, context: ReportContext): void {
  withReportScope(context, () => {
    Sentry.captureMessage(message, "error");
  });
}

export function reportStorageUploadFailure(
  error: unknown,
  code: "cv" | "certificate" | "avatar",
): void {
  reportException(error, { area: "storage", code: `${code}_upload_failed` });
}
