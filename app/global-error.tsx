"use client";

import { useEffect, useSyncExternalStore } from "react";

import { errorCopyForLocale, localeFromCookieHeader } from "@/lib/i18n/errorCopy";
import { reportException } from "@/lib/monitoring/report";

function subscribe() {
  return () => {};
}

function localeSnapshot() {
  return localeFromCookieHeader(document.cookie);
}

function serverLocaleSnapshot() {
  return "et";
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useSyncExternalStore(subscribe, localeSnapshot, serverLocaleSnapshot);
  const copy = errorCopyForLocale(locale);

  useEffect(() => {
    reportException(error, {
      area: "client",
      code: "global_error_boundary",
      extras: { digest: error.digest ?? null },
    });
  }, [error]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <title>{`${copy.title} · Kvalifits`}</title>
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0f0f16",
          color: "#f0eef6",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <main style={{ maxWidth: 32 * 16, margin: "0 auto", padding: "4rem 1.5rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: "0 0 0.75rem" }}>
            {copy.title}
          </h1>
          <p style={{ color: "rgba(198, 194, 218, 0.82)", lineHeight: 1.5, margin: "0 0 1.5rem" }}>
            {copy.body}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              height: 44,
              padding: "0 1.25rem",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {copy.retry}
          </button>
        </main>
      </body>
    </html>
  );
}
