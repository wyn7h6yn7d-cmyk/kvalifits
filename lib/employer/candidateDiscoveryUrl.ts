import {
  emptyCandidateFilterState,
  type CandidateFilterState,
} from "@/lib/employer/candidateFilters";

export const CANDIDATE_DISCOVERY_PATH = "/account/employer/candidates";

export type CandidateDiscoveryUrlState = {
  filters: CandidateFilterState;
  page: number;
};

function getOne(
  input: URLSearchParams | Readonly<Record<string, string | string[] | undefined>>,
  key: string,
): string | undefined {
  if (input instanceof URLSearchParams) {
    const v = input.get(key);
    return v?.trim() || undefined;
  }
  const raw = input[key];
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v?.trim() || undefined;
}

function getAll(
  input: URLSearchParams | Readonly<Record<string, string | string[] | undefined>>,
  key: string,
): string[] {
  if (input instanceof URLSearchParams) {
    return input.getAll(key).map((v) => v.trim()).filter(Boolean);
  }
  const raw = input[key];
  if (Array.isArray(raw)) return raw.map((v) => v.trim()).filter(Boolean);
  if (raw?.trim()) return [raw.trim()];
  return [];
}

function flag(
  input: URLSearchParams | Readonly<Record<string, string | string[] | undefined>>,
  key: string,
): boolean {
  const v = getOne(input, key);
  return v === "1" || v === "true";
}

function uniq(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const t = v.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

export function parseCandidateDiscoveryParams(
  input: URLSearchParams | Readonly<Record<string, string | string[] | undefined>>,
): CandidateDiscoveryUrlState {
  const pageRaw = Number(getOne(input, "page") ?? "1");
  const page = Number.isFinite(pageRaw) ? Math.max(1, Math.floor(pageRaw)) : 1;

  const filters: CandidateFilterState = {
    ...emptyCandidateFilterState(),
    query: getOne(input, "q") ?? getOne(input, "query") ?? "",
    seekingFirstJob: flag(input, "first"),
    experienceNotRequired: flag(input, "exp0"),
    experienceYearsMin: getOne(input, "ymin") ?? "",
    experienceYearsMax: getOne(input, "ymax") ?? "",
    partTime: flag(input, "pt"),
    fullTime: flag(input, "ft"),
    desiredHoursMin: getOne(input, "hmin") ?? "",
    desiredHoursMax: getOne(input, "hmax") ?? "",
    dayWork: flag(input, "day"),
    eveningWork: flag(input, "evening"),
    shiftWork: flag(input, "shift"),
    weekendWork: flag(input, "weekend"),
    flexibleHours: flag(input, "flex"),
    remote: flag(input, "remote"),
    hybrid: flag(input, "hybrid"),
    onSite: flag(input, "onsite"),
    locations: uniq(getAll(input, "loc")),
    languages: uniq(getAll(input, "lang")),
    certificates: uniq(getAll(input, "cert")),
    skills: uniq(getAll(input, "skill")),
    availability: uniq(getAll(input, "avail")),
    accessibleWorkplace: flag(input, "access"),
    adaptedArrangement: flag(input, "adapted"),
    extraBreaks: flag(input, "breaks"),
  };

  return { filters, page };
}

export function candidateDiscoverySearchParams(state: {
  filters: CandidateFilterState;
  page?: number;
}): URLSearchParams {
  const sp = new URLSearchParams();
  const f = state.filters;
  const q = f.query.trim();
  if (q) sp.set("q", q);
  if (f.seekingFirstJob) sp.set("first", "1");
  if (f.experienceNotRequired) sp.set("exp0", "1");
  if (f.experienceYearsMin.trim()) sp.set("ymin", f.experienceYearsMin.trim());
  if (f.experienceYearsMax.trim()) sp.set("ymax", f.experienceYearsMax.trim());
  if (f.partTime) sp.set("pt", "1");
  if (f.fullTime) sp.set("ft", "1");
  if (f.desiredHoursMin.trim()) sp.set("hmin", f.desiredHoursMin.trim());
  if (f.desiredHoursMax.trim()) sp.set("hmax", f.desiredHoursMax.trim());
  if (f.dayWork) sp.set("day", "1");
  if (f.eveningWork) sp.set("evening", "1");
  if (f.shiftWork) sp.set("shift", "1");
  if (f.weekendWork) sp.set("weekend", "1");
  if (f.flexibleHours) sp.set("flex", "1");
  if (f.remote) sp.set("remote", "1");
  if (f.hybrid) sp.set("hybrid", "1");
  if (f.onSite) sp.set("onsite", "1");
  if (f.accessibleWorkplace) sp.set("access", "1");
  if (f.adaptedArrangement) sp.set("adapted", "1");
  if (f.extraBreaks) sp.set("breaks", "1");
  for (const loc of uniq(f.locations)) sp.append("loc", loc);
  for (const lang of uniq(f.languages)) sp.append("lang", lang);
  for (const cert of uniq(f.certificates)) sp.append("cert", cert);
  for (const skill of uniq(f.skills)) sp.append("skill", skill);
  for (const avail of uniq(f.availability)) sp.append("avail", avail);
  const page = state.page ?? 1;
  if (page > 1) sp.set("page", String(page));
  return sp;
}

export function buildCandidateDiscoveryUrl(state: {
  filters: CandidateFilterState;
  page?: number;
}): string {
  const qs = candidateDiscoverySearchParams(state).toString();
  return qs ? `${CANDIDATE_DISCOVERY_PATH}?${qs}` : CANDIDATE_DISCOVERY_PATH;
}
