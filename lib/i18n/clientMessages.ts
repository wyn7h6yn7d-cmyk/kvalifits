import type { AbstractIntlMessages } from "next-intl";

/** Shell chrome — always hydrated for layout client components. */
export const SHARED_CLIENT_MESSAGE_NAMESPACES = [
  "nav",
  "language",
  "cookieConsent",
  "footer",
  "errors",
  "ui",
  "notifications",
] as const;

/**
 * Public marketing + job-search client surfaces.
 * Excludes admin, full onboarding, employer candidates, account privacy.
 * Experience facet labels use a slim `onboarding.experienceLevelOption` pick.
 */
export const SITE_CLIENT_MESSAGE_NAMESPACES = [
  ...SHARED_CLIENT_MESSAGE_NAMESPACES,
  "hero",
  "heroMockup",
  "jobCard",
  "jobs",
  "jobsSearch",
  "jobsFacets",
  "savedSearches",
  "savedJobs",
  "companies",
  "legalChrome",
  "consent",
  "pages",
  "auth",
] as const;

export const AUTH_CLIENT_MESSAGE_NAMESPACES = [
  ...SHARED_CLIENT_MESSAGE_NAMESPACES,
  "auth",
  "consent",
  "legalChrome",
] as const;

export const ONBOARDING_CLIENT_MESSAGE_NAMESPACES = [
  ...SHARED_CLIENT_MESSAGE_NAMESPACES,
  "onboarding",
  "education",
  "auth",
  "accountSecurity",
] as const;

export const ACCOUNT_CLIENT_MESSAGE_NAMESPACES = [
  ...SHARED_CLIENT_MESSAGE_NAMESPACES,
  "jobs",
  "jobCard",
  "jobsSearch",
  "jobsFacets",
  "onboarding",
  "auth",
  "accountPrivacy",
  "accountSecurity",
  "savedJobs",
  "savedSearches",
  "seekerDashboard",
  "employerCandidates",
  "education",
  "employer",
  "companies",
] as const;

export const ADMIN_CLIENT_MESSAGE_NAMESPACES = [
  ...SHARED_CLIENT_MESSAGE_NAMESPACES,
  "admin",
  "onboarding",
  "jobs",
  "auth",
] as const;

export type ClientMessageNamespace =
  | (typeof SHARED_CLIENT_MESSAGE_NAMESPACES)[number]
  | (typeof SITE_CLIENT_MESSAGE_NAMESPACES)[number]
  | (typeof ACCOUNT_CLIENT_MESSAGE_NAMESPACES)[number]
  | (typeof ADMIN_CLIENT_MESSAGE_NAMESPACES)[number]
  | (typeof ONBOARDING_CLIENT_MESSAGE_NAMESPACES)[number]
  | (typeof AUTH_CLIENT_MESSAGE_NAMESPACES)[number];

export function pickClientMessages(
  messages: AbstractIntlMessages,
  namespaces: readonly string[],
): AbstractIntlMessages {
  const out: AbstractIntlMessages = {};
  for (const key of namespaces) {
    if (Object.prototype.hasOwnProperty.call(messages, key)) {
      out[key] = messages[key] as AbstractIntlMessages[string];
    }
  }
  return out;
}

/** Public site pick — adds only experience facet labels from onboarding. */
export function pickSiteClientMessages(messages: AbstractIntlMessages): AbstractIntlMessages {
  const out = pickClientMessages(messages, SITE_CLIENT_MESSAGE_NAMESPACES);
  const onboarding = messages.onboarding;
  if (onboarding && typeof onboarding === "object" && !Array.isArray(onboarding)) {
    const experienceLevelOption = (onboarding as Record<string, unknown>).experienceLevelOption;
    if (experienceLevelOption) {
      out.onboarding = {
        experienceLevelOption,
      } as unknown as AbstractIntlMessages[string];
    }
  }
  return out;
}

export function estimateMessageChars(messages: AbstractIntlMessages): number {
  try {
    return JSON.stringify(messages).length;
  } catch {
    return 0;
  }
}
