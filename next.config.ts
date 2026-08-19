import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

function supabaseStorageRemotePattern(): { protocol: "https"; hostname: string; pathname: string } | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    const host = new URL(raw).hostname;
    if (!host) return null;
    return { protocol: "https", hostname: host, pathname: "/storage/v1/object/public/**" };
  } catch {
    return null;
  }
}

const supabasePattern = supabaseStorageRemotePattern();

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabasePattern ? [supabasePattern] : [],
  },
};

const sentryAuthToken = (process.env.SENTRY_AUTH_TOKEN ?? "").trim();

export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: sentryAuthToken || undefined,
  silent: !sentryAuthToken,
  telemetry: false,
  tunnelRoute: "/monitoring-tunnel",
  sourcemaps: {
    disable: !sentryAuthToken,
    deleteSourcemapsAfterUpload: true,
  },
});
