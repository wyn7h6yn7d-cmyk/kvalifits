export type NavKey =
  | "jobs"
  | "jobsShort"
  | "companies"
  | "forSeekers"
  | "forEmployers"
  | "faq"
  | "seekerOverview"
  | "seekerMatches"
  | "seekerMatchesShort"
  | "seekerApplications"
  | "seekerSaved"
  | "seekerNotifications"
  | "seekerJobAlerts"
  | "seekerProfile"
  | "seekerCertificates"
  | "employerOverview"
  | "employerJobPosts"
  | "candidates"
  | "admin"
  | "adminModeration";

export type NavItem = {
  href: string;
  key: NavKey;
};

export const GUEST_NAV: NavItem[] = [
  { href: "/tood", key: "jobs" },
  { href: "/ettevotted", key: "companies" },
  { href: "/toootsijatele", key: "forSeekers" },
  { href: "/tooandjatele", key: "forEmployers" },
  { href: "/kkk", key: "faq" },
];

/** Public marketing/site pages keep the simple guest nav even when signed in. */
export function isDashboardNavPath(pathname: string): boolean {
  return (
    pathname === "/account" ||
    pathname.startsWith("/account/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding/")
  );
}

export type NavbarRole = "seeker" | "employer" | "admin" | null;

export function resolveDesktopNavItems(
  pathname: string,
  authenticated: boolean,
  role: NavbarRole,
): NavItem[] {
  if (!isDashboardNavPath(pathname)) {
    return GUEST_NAV;
  }

  if (!authenticated) return GUEST_NAV;
  if (role === "employer") return EMPLOYER_NAV;
  if (role === "seeker") return SEEKER_NAV;
  if (role === "admin") return ADMIN_NAV;
  return GUEST_NAV;
}

export function resolveMobileNavItems(
  pathname: string,
  authenticated: boolean,
  role: NavbarRole,
): NavItem[] {
  if (!isDashboardNavPath(pathname)) {
    return GUEST_NAV;
  }

  if (authenticated && role === "seeker") {
    return SEEKER_MOBILE_NAV;
  }

  return resolveDesktopNavItems(pathname, authenticated, role);
}

export const SEEKER_NAV: NavItem[] = [
  { href: "/account/seeker", key: "seekerOverview" },
  { href: "/account/seeker/matches", key: "seekerMatches" },
  { href: "/account/seeker/applications", key: "seekerApplications" },
  { href: "/account/seeker/saved", key: "seekerSaved" },
  { href: "/account/notifications", key: "seekerNotifications" },
  { href: "/account/seeker/alerts", key: "seekerJobAlerts" },
  { href: "/account/seeker/profile", key: "seekerProfile" },
  { href: "/account/seeker/certificates", key: "seekerCertificates" },
];

/** Compact sheet list — desktop seeker nav stays unchanged. */
export const SEEKER_MOBILE_NAV: NavItem[] = [
  { href: "/tood", key: "jobs" },
  { href: "/account/seeker/matches", key: "seekerMatches" },
  { href: "/account/seeker/applications", key: "seekerApplications" },
  { href: "/account/seeker/saved", key: "seekerSaved" },
  { href: "/account/notifications", key: "seekerNotifications" },
  { href: "/account/seeker/alerts", key: "seekerJobAlerts" },
  { href: "/account/seeker/profile", key: "seekerProfile" },
];

export const SEEKER_BOTTOM_NAV: NavItem[] = [
  { href: "/tood", key: "jobsShort" },
  { href: "/account/seeker/matches", key: "seekerMatchesShort" },
  { href: "/account/seeker/applications", key: "seekerApplications" },
  { href: "/account/seeker/profile", key: "seekerProfile" },
];

/** Messaging is not shipped; do not add /account/employer/messages here. */
export const EMPLOYER_NAV: NavItem[] = [
  { href: "/account/employer", key: "employerOverview" },
  { href: "/account/employer/jobs", key: "employerJobPosts" },
  { href: "/account/notifications", key: "seekerNotifications" },
  { href: "/account/employer/candidates", key: "candidates" },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/tood", key: "jobs" },
  { href: "/admin/moderation", key: "adminModeration" },
  { href: "/admin", key: "admin" },
];
