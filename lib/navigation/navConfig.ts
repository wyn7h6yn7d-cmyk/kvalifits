export type NavKey =
  | "jobs"
  | "jobsShort"
  | "companies"
  | "forSeekers"
  | "forEmployers"
  | "seekerOverview"
  | "seekerMatches"
  | "seekerMatchesShort"
  | "seekerApplications"
  | "seekerSaved"
  | "seekerNotifications"
  | "seekerProfile"
  | "seekerCertificates"
  | "employerOverview"
  | "employerJobPosts"
  | "candidates"
  | "employerMessages"
  | "employerCompany"
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
];

export const SEEKER_NAV: NavItem[] = [
  { href: "/account/seeker", key: "seekerOverview" },
  { href: "/account/seeker/matches", key: "seekerMatches" },
  { href: "/account/seeker/applications", key: "seekerApplications" },
  { href: "/account/seeker/saved", key: "seekerSaved" },
  { href: "/account/seeker/notifications", key: "seekerNotifications" },
  { href: "/account/seeker/profile", key: "seekerProfile" },
  { href: "/account/seeker/certificates", key: "seekerCertificates" },
];

export const SEEKER_BOTTOM_NAV: NavItem[] = [
  { href: "/tood", key: "jobsShort" },
  { href: "/account/seeker/matches", key: "seekerMatchesShort" },
  { href: "/account/seeker/applications", key: "seekerApplications" },
  { href: "/account/seeker/profile", key: "seekerProfile" },
];

export const EMPLOYER_NAV: NavItem[] = [
  { href: "/account/employer", key: "employerOverview" },
  { href: "/account/employer/jobs", key: "employerJobPosts" },
  { href: "/account/employer/candidates", key: "candidates" },
  { href: "/account/employer/messages", key: "employerMessages" },
  { href: "/account/employer", key: "employerCompany" },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/tood", key: "jobs" },
  { href: "/admin/moderation", key: "adminModeration" },
  { href: "/admin", key: "admin" },
];
