import {
  getPublicDisplayName,
  type CandidateCertificateSummary,
  type CandidateFilterState,
  type DiscoverableCandidate,
} from "@/lib/employer/candidateFilters";

/** Default page size is inside the 20–30 range requested for discovery. */
export const CANDIDATE_DISCOVERY_PAGE_SIZE = 24;
export const CANDIDATE_DISCOVERY_PAGE_SIZE_MIN = 20;
export const CANDIDATE_DISCOVERY_PAGE_SIZE_MAX = 30;

/** Columns employers may see on the discovery surface. Everything else is stripped. */
export const DISCOVERY_ALLOWED_PROFILE_FIELDS = [
  "id",
  "userId",
  "displayName",
  "location",
  "preferredLocations",
  "experienceLevel",
  "profileTitle",
  "skills",
  "languages",
  "preferredJobTypes",
  "seekingFirstJob",
  "experienceDurationYears",
  "prefFullTime",
  "prefPartTime",
  "prefDesiredWeeklyHours",
  "prefMinWeeklyHours",
  "prefMaxWeeklyHours",
  "prefDayWork",
  "prefEveningWork",
  "prefShiftWork",
  "prefWeekendWork",
  "prefFlexibleHours",
  "prefRemoteWork",
  "prefHybridWork",
  "prefOnSiteWork",
  "discoveryAccessibleWorkplace",
  "discoveryAdaptedArrangement",
  "discoveryExtraBreaks",
  "certificates",
  "hasBLicense",
] as const;

export const DISCOVERY_FORBIDDEN_PROFILE_FIELDS = [
  "phone",
  "cv_url",
  "cvUrl",
  "date_of_birth",
  "dateOfBirth",
  "about",
  "work_capacity",
  "workCapacity",
  "work_authorization_notes",
  "salary_expectation",
  "is_minor",
  "legal_representative_consent_status",
  "learning_obligation_status",
  "full_name",
  "fullName",
  "email",
] as const;

export const DISCOVERY_ALLOWED_CERTIFICATE_FIELDS = [
  "name",
  "validUntil",
  "issuer",
  "verification_status",
  "verified_at",
  "verification_source",
] as const;

export const DISCOVERY_FORBIDDEN_CERTIFICATE_FIELDS = [
  "certificate_image_url",
  "certificate_number",
  "certificateImageUrl",
  "certificateNumber",
  "storage_path",
  "file_url",
] as const;

export type DiscoveryCaller = {
  isAuthenticated: boolean;
  isEmployer: boolean;
};

export function mayLoadDiscoverableCandidates(caller: DiscoveryCaller): boolean {
  return caller.isAuthenticated && caller.isEmployer;
}

export function clampDiscoveryPageSize(pageSize: number | null | undefined): number {
  const n = Number(pageSize);
  if (!Number.isFinite(n)) return CANDIDATE_DISCOVERY_PAGE_SIZE;
  return Math.min(
    CANDIDATE_DISCOVERY_PAGE_SIZE_MAX,
    Math.max(1, Math.floor(n)),
  );
}

export function clampDiscoveryPage(page: number | null | undefined, totalPages: number): number {
  const n = Number(page);
  const pages = Math.max(1, Math.floor(Number(totalPages) || 1));
  if (!Number.isFinite(n)) return 1;
  return Math.min(pages, Math.max(1, Math.floor(n)));
}

export function discoveryPageCount(totalCount: number, pageSize: number): number {
  const size = clampDiscoveryPageSize(pageSize);
  const total = Math.max(0, Math.floor(Number(totalCount) || 0));
  return Math.max(1, Math.ceil(total / size) || 1);
}

export function discoveryOffset(page: number, pageSize: number): number {
  const size = clampDiscoveryPageSize(pageSize);
  const p = Math.max(1, Math.floor(Number(page) || 1));
  return (p - 1) * size;
}

export function sliceDiscoveryPage<T>(items: readonly T[], page: number, pageSize: number): T[] {
  const size = clampDiscoveryPageSize(pageSize);
  const start = discoveryOffset(page, size);
  return items.slice(start, start + size);
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

function asNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function asBool(v: unknown): boolean {
  return v === true || v === "true" || v === 1 || v === "1";
}

function mapCertificate(raw: unknown): CandidateCertificateSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const name = String(row.name ?? row.certificate_name ?? "").trim();
  if (!name) return null;
  const mapped: CandidateCertificateSummary = {
    name,
    validUntil:
      (row.validUntil as string | null | undefined) ??
      (row.certificate_valid_until as string | null | undefined) ??
      null,
    issuer: (row.issuer as string | null | undefined) ?? (row.certificate_issuer as string | null | undefined) ?? null,
    verification_status: (row.verification_status as string | null | undefined) ?? null,
    verified_at: (row.verified_at as string | null | undefined) ?? null,
    verification_source: (row.verification_source as string | null | undefined) ?? null,
  };
  for (const key of DISCOVERY_FORBIDDEN_CERTIFICATE_FIELDS) {
    delete (mapped as Record<string, unknown>)[key];
  }
  return mapped;
}

export function mapDiscoveryRpcRow(raw: unknown): DiscoverableCandidate | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = String(row.id ?? "").trim();
  const userId = String(row.user_id ?? row.userId ?? "").trim();
  if (!id || !userId) return null;

  const candidate: DiscoverableCandidate = {
    id,
    userId,
    displayName: getPublicDisplayName((row.full_name as string | null) ?? (row.displayName as string | null) ?? null),
    location: (row.location as string | null) ?? null,
    preferredLocations: asStringArray(row.preferred_locations ?? row.preferredLocations),
    experienceLevel: (row.experience_level as string | null) ?? (row.experienceLevel as string | null) ?? null,
    profileTitle: (row.profile_title as string | null) ?? (row.profileTitle as string | null) ?? null,
    skills: asStringArray(row.skills),
    languages: asStringArray(row.languages),
    preferredJobTypes: asStringArray(row.preferred_job_types ?? row.preferredJobTypes),
    seekingFirstJob: asBool(row.exp_seeking_first_job ?? row.seekingFirstJob),
    experienceDurationYears: asNumberOrNull(row.experience_duration_years ?? row.experienceDurationYears),
    prefFullTime: asBool(row.pref_full_time ?? row.prefFullTime),
    prefPartTime: asBool(row.pref_part_time ?? row.prefPartTime),
    prefDesiredWeeklyHours: asNumberOrNull(row.pref_desired_weekly_hours ?? row.prefDesiredWeeklyHours),
    prefMinWeeklyHours: asNumberOrNull(row.pref_min_weekly_hours ?? row.prefMinWeeklyHours),
    prefMaxWeeklyHours: asNumberOrNull(row.pref_max_weekly_hours ?? row.prefMaxWeeklyHours),
    prefDayWork: asBool(row.pref_day_work ?? row.prefDayWork),
    prefEveningWork: asBool(row.pref_evening_work ?? row.prefEveningWork),
    prefShiftWork: asBool(row.pref_shift_work ?? row.prefShiftWork),
    prefWeekendWork: asBool(row.pref_weekend_work ?? row.prefWeekendWork),
    prefFlexibleHours: asBool(row.pref_flexible_hours ?? row.prefFlexibleHours),
    prefRemoteWork: asBool(row.pref_remote_work ?? row.prefRemoteWork),
    prefHybridWork: asBool(row.pref_hybrid_work ?? row.prefHybridWork),
    prefOnSiteWork: asBool(row.pref_on_site_work ?? row.prefOnSiteWork),
    discoveryAccessibleWorkplace: asBool(
      row.discovery_accessible_workplace ?? row.discoveryAccessibleWorkplace,
    ),
    discoveryAdaptedArrangement: asBool(
      row.discovery_adapted_arrangement ?? row.discoveryAdaptedArrangement,
    ),
    discoveryExtraBreaks: asBool(row.discovery_extra_breaks ?? row.discoveryExtraBreaks),
    certificates: Array.isArray(row.certificates)
      ? row.certificates.map(mapCertificate).filter((x): x is CandidateCertificateSummary => Boolean(x))
      : [],
    hasBLicense: asBool(row.has_b_category_drivers_license ?? row.hasBLicense),
  };

  const leaked = Object.keys(candidate).filter(
    (key) => !(DISCOVERY_ALLOWED_PROFILE_FIELDS as readonly string[]).includes(key),
  );
  if (leaked.length) {
    for (const key of leaked) delete (candidate as Record<string, unknown>)[key];
  }
  return candidate;
}

export type DiscoveryRpcPayload = {
  candidates: DiscoverableCandidate[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
};

export function emptyDiscoveryRpcPayload(pageSize = CANDIDATE_DISCOVERY_PAGE_SIZE): DiscoveryRpcPayload {
  return {
    candidates: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 1,
    pageSize: clampDiscoveryPageSize(pageSize),
  };
}

export function parseDiscoveryRpcPayload(raw: unknown): DiscoveryRpcPayload {
  if (!raw || typeof raw !== "object") return emptyDiscoveryRpcPayload();
  const o = raw as Record<string, unknown>;
  const pageSize = clampDiscoveryPageSize(
    Number(o.page_size ?? o.pageSize) || CANDIDATE_DISCOVERY_PAGE_SIZE,
  );
  const totalCount = Math.max(0, Math.floor(Number(o.total_count ?? o.totalCount) || 0));
  const totalPages = discoveryPageCount(totalCount, pageSize);
  const currentPage = clampDiscoveryPage(Number(o.current_page ?? o.currentPage) || 1, totalPages);
  const list = Array.isArray(o.candidates) ? o.candidates : [];
  const candidates = list
    .map(mapDiscoveryRpcRow)
    .filter((x): x is DiscoverableCandidate => Boolean(x))
    .slice(0, pageSize);
  return { candidates, totalCount, currentPage, totalPages, pageSize };
}

function parseOptionalNumber(v: string): number | null {
  const t = v.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function emptyArr(values: string[]): string[] | null {
  const cleaned = values.map((v) => v.trim()).filter(Boolean);
  return cleaned.length ? cleaned : null;
}

export type SearchDiscoverableCandidatesArgs = {
  p_query: string | null;
  p_seeking_first_job: boolean;
  p_experience_not_required: boolean;
  p_experience_years_min: number | null;
  p_experience_years_max: number | null;
  p_part_time: boolean;
  p_full_time: boolean;
  p_hours_min: number | null;
  p_hours_max: number | null;
  p_day_work: boolean;
  p_evening_work: boolean;
  p_shift_work: boolean;
  p_weekend_work: boolean;
  p_flexible_hours: boolean;
  p_remote: boolean;
  p_hybrid: boolean;
  p_on_site: boolean;
  p_accessible_workplace: boolean;
  p_adapted_arrangement: boolean;
  p_extra_breaks: boolean;
  p_locations: string[] | null;
  p_languages: string[] | null;
  p_certificates: string[] | null;
  p_skills: string[] | null;
  p_availability: string[] | null;
  p_page: number;
  p_page_size: number;
};

export function rpcArgsFromDiscoveryFilters(params: {
  filters: CandidateFilterState;
  page: number;
  pageSize?: number;
}): SearchDiscoverableCandidatesArgs {
  const f = params.filters;
  const q = f.query.trim().slice(0, 200).replace(/[%_]/g, " ");
  return {
    p_query: q || null,
    p_seeking_first_job: f.seekingFirstJob,
    p_experience_not_required: f.experienceNotRequired,
    p_experience_years_min: parseOptionalNumber(f.experienceYearsMin),
    p_experience_years_max: parseOptionalNumber(f.experienceYearsMax),
    p_part_time: f.partTime,
    p_full_time: f.fullTime,
    p_hours_min: parseOptionalNumber(f.desiredHoursMin),
    p_hours_max: parseOptionalNumber(f.desiredHoursMax),
    p_day_work: f.dayWork,
    p_evening_work: f.eveningWork,
    p_shift_work: f.shiftWork,
    p_weekend_work: f.weekendWork,
    p_flexible_hours: f.flexibleHours,
    p_remote: f.remote,
    p_hybrid: f.hybrid,
    p_on_site: f.onSite,
    p_accessible_workplace: f.accessibleWorkplace,
    p_adapted_arrangement: f.adaptedArrangement,
    p_extra_breaks: f.extraBreaks,
    p_locations: emptyArr(f.locations),
    p_languages: emptyArr(f.languages),
    p_certificates: emptyArr(f.certificates),
    p_skills: emptyArr(f.skills),
    p_availability: emptyArr(f.availability),
    p_page: Math.max(1, Math.floor(params.page) || 1),
    p_page_size: clampDiscoveryPageSize(params.pageSize ?? CANDIDATE_DISCOVERY_PAGE_SIZE),
  };
}

export function isDiscoveryRpcMissing(message: string | undefined): boolean {
  return /function|schema cache|does not exist|search_discoverable_candidates|discoverable_candidate/i.test(
    message ?? "",
  );
}
