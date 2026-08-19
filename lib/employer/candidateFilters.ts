/**
 * Employer candidate discovery filters — practical fit only.
 * Never filter by disability, diagnosis, health status, or work-capacity.
 */

export type CandidateCertificateSummary = {
  name: string;
  validUntil: string | null;
  issuer?: string | null;
  verification_status?: string | null;
  verified_at?: string | null;
  verification_source?: string | null;
};

/** Public discovery name: given name + last initial. Never send the full surname to the browser. */
export function getPublicDisplayName(fullName: string | null | undefined): string {
  const s = (fullName ?? "").trim();
  if (!s) return "—";
  const parts = s.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0]!;
  const first = parts.slice(0, -1).join(" ");
  const last = parts[parts.length - 1] ?? "";
  const initial = last.trim() ? `${last.trim()[0]!.toUpperCase()}.` : "";
  return initial ? `${first} ${initial}` : first;
}

export type DiscoverableCandidate = {
  id: string;
  userId: string;
  displayName: string;
  location: string | null;
  preferredLocations: string[];
  experienceLevel: string | null;
  profileTitle: string | null;
  skills: string[];
  languages: string[];
  preferredJobTypes: string[];
  seekingFirstJob: boolean;
  experienceDurationYears: number | null;
  prefFullTime: boolean;
  prefPartTime: boolean;
  prefDesiredWeeklyHours: number | null;
  prefMinWeeklyHours: number | null;
  prefMaxWeeklyHours: number | null;
  prefDayWork: boolean;
  prefEveningWork: boolean;
  prefShiftWork: boolean;
  prefWeekendWork: boolean;
  prefFlexibleHours: boolean;
  prefRemoteWork: boolean;
  prefHybridWork: boolean;
  prefOnSiteWork: boolean;
  /** True only when seeker opted to share this practical need for discovery. */
  discoveryAccessibleWorkplace: boolean;
  /** True only when seeker opted to share this practical need for discovery. */
  discoveryAdaptedArrangement: boolean;
  /** True only when seeker opted to share this practical need for discovery. */
  discoveryExtraBreaks: boolean;
  certificates: CandidateCertificateSummary[];
  hasBLicense: boolean;
};

export type CandidateFilterState = {
  query: string;
  seekingFirstJob: boolean;
  /** Candidates suitable when experience is not required (first job / entry / 0 years). */
  experienceNotRequired: boolean;
  experienceYearsMin: string;
  experienceYearsMax: string;
  partTime: boolean;
  fullTime: boolean;
  desiredHoursMin: string;
  desiredHoursMax: string;
  dayWork: boolean;
  eveningWork: boolean;
  shiftWork: boolean;
  weekendWork: boolean;
  flexibleHours: boolean;
  remote: boolean;
  hybrid: boolean;
  onSite: boolean;
  locations: string[];
  languages: string[];
  certificates: string[];
  skills: string[];
  /** Preferred engagement / availability labels (from preferred_job_types). */
  availability: string[];
  accessibleWorkplace: boolean;
  adaptedArrangement: boolean;
  /** Practical: candidate shared need for regular extra breaks (not health status). */
  extraBreaks: boolean;
};

export const emptyCandidateFilterState = (): CandidateFilterState => ({
  query: "",
  seekingFirstJob: false,
  experienceNotRequired: false,
  experienceYearsMin: "",
  experienceYearsMax: "",
  partTime: false,
  fullTime: false,
  desiredHoursMin: "",
  desiredHoursMax: "",
  dayWork: false,
  eveningWork: false,
  shiftWork: false,
  weekendWork: false,
  flexibleHours: false,
  remote: false,
  hybrid: false,
  onSite: false,
  locations: [],
  languages: [],
  certificates: [],
  skills: [],
  availability: [],
  accessibleWorkplace: false,
  adaptedArrangement: false,
  extraBreaks: false,
});

/** Common language chips always offered; also matched against skills when languages[] is empty. */
export const COMMON_LANGUAGE_CHIPS = ["Eesti", "Inglise", "Vene"] as const;

const LANGUAGE_ALIASES: Record<string, string[]> = {
  eesti: ["eesti", "estonian", "et"],
  inglise: ["inglise", "english", "en"],
  vene: ["vene", "russian", "ru", "русский"],
};

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseOptionalNumber(v: string): number | null {
  const t = v.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function toggleInList(list: string[], value: string): string[] {
  const n = value.trim();
  if (!n) return list;
  return list.includes(n) ? list.filter((x) => x !== n) : [...list, n];
}

export function toggleFilterValue(
  state: CandidateFilterState,
  key: "locations" | "languages" | "certificates" | "skills" | "availability",
  value: string
): CandidateFilterState {
  return { ...state, [key]: toggleInList(state[key], value) };
}

function locationHaystack(c: DiscoverableCandidate): string[] {
  const out: string[] = [];
  if (c.location?.trim()) {
    out.push(c.location.trim());
    for (const p of c.location.split(/[/,|]/).map((x) => x.trim()).filter(Boolean)) {
      out.push(p);
    }
  }
  for (const loc of c.preferredLocations) {
    if (loc.trim()) out.push(loc.trim());
  }
  return out;
}

function candidateKnowsLanguage(c: DiscoverableCandidate, chip: string): boolean {
  const key = norm(chip);
  const aliases = LANGUAGE_ALIASES[key] ?? [key];
  const langs = c.languages.map(norm);
  if (langs.some((l) => aliases.includes(l) || l.includes(key) || key.includes(l))) return true;
  const skillHay = c.skills.map(norm).join(" ");
  return aliases.some((a) => skillHay.includes(a));
}

function fitsExperienceNotRequired(c: DiscoverableCandidate): boolean {
  if (c.seekingFirstJob) return true;
  if (c.experienceDurationYears === 0) return true;
  const level = (c.experienceLevel ?? "").trim().toLowerCase();
  return level === "entry" || level === "not_required";
}

function hoursOverlap(
  c: DiscoverableCandidate,
  filterMin: number | null,
  filterMax: number | null
): boolean {
  if (filterMin === null && filterMax === null) return true;

  const desired = c.prefDesiredWeeklyHours;
  if (desired !== null) {
    if (filterMin !== null && desired < filterMin) return false;
    if (filterMax !== null && desired > filterMax) return false;
    return true;
  }

  const cMin = c.prefMinWeeklyHours;
  const cMax = c.prefMaxWeeklyHours;
  if (cMin === null && cMax === null) return false;

  const low = cMin ?? cMax!;
  const high = cMax ?? cMin!;
  if (filterMin !== null && high < filterMin) return false;
  if (filterMax !== null && low > filterMax) return false;
  return true;
}

export function candidateMatchesFilters(
  c: DiscoverableCandidate,
  f: CandidateFilterState
): boolean {
  const q = norm(f.query);
  if (q) {
    const hay = [
      c.displayName,
      c.profileTitle ?? "",
      c.location ?? "",
      c.experienceLevel ?? "",
      c.skills.join(" "),
      c.languages.join(" "),
      c.preferredLocations.join(" "),
      c.preferredJobTypes.join(" "),
      c.certificates.map((x) => x.name).join(" "),
    ]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }

  if (f.seekingFirstJob && !c.seekingFirstJob) return false;
  if (f.experienceNotRequired && !fitsExperienceNotRequired(c)) return false;

  const yMin = parseOptionalNumber(f.experienceYearsMin);
  const yMax = parseOptionalNumber(f.experienceYearsMax);
  if (yMin !== null || yMax !== null) {
    const years = c.experienceDurationYears;
    if (years === null) {
      if (!(c.seekingFirstJob && (yMin === null || yMin <= 0))) return false;
    } else {
      if (yMin !== null && years < yMin) return false;
      if (yMax !== null && years > yMax) return false;
    }
  }

  if (f.partTime && !c.prefPartTime) return false;
  if (f.fullTime && !c.prefFullTime) return false;

  const hMin = parseOptionalNumber(f.desiredHoursMin);
  const hMax = parseOptionalNumber(f.desiredHoursMax);
  if ((hMin !== null || hMax !== null) && !hoursOverlap(c, hMin, hMax)) return false;

  if (f.dayWork && !c.prefDayWork) return false;
  if (f.eveningWork && !c.prefEveningWork) return false;
  if (f.shiftWork && !c.prefShiftWork) return false;
  if (f.weekendWork && !c.prefWeekendWork) return false;
  if (f.flexibleHours && !c.prefFlexibleHours) return false;
  if (f.remote && !c.prefRemoteWork) return false;
  if (f.hybrid && !c.prefHybridWork) return false;
  if (f.onSite && !c.prefOnSiteWork) return false;

  if (f.accessibleWorkplace && !c.discoveryAccessibleWorkplace) return false;
  if (f.adaptedArrangement && !c.discoveryAdaptedArrangement) return false;
  if (f.extraBreaks && !c.discoveryExtraBreaks) return false;

  for (const loc of f.locations) {
    const n = norm(loc);
    if (!locationHaystack(c).some((x) => norm(x).includes(n) || n.includes(norm(x)))) {
      return false;
    }
  }

  for (const lang of f.languages) {
    if (!candidateKnowsLanguage(c, lang)) return false;
  }

  for (const cert of f.certificates) {
    const n = norm(cert);
    const hit =
      c.certificates.some((x) => norm(x.name).includes(n) || n.includes(norm(x.name))) ||
      (n.includes("b-kategooria") || n === "b" || n.includes("b-category")
        ? c.hasBLicense
        : false);
    if (!hit) return false;
  }

  for (const skill of f.skills) {
    const n = norm(skill);
    if (!c.skills.some((s) => norm(s).includes(n) || n.includes(norm(s)))) return false;
  }

  for (const a of f.availability) {
    const n = norm(a);
    if (!c.preferredJobTypes.some((t) => norm(t).includes(n) || n.includes(norm(t)))) {
      return false;
    }
  }

  return true;
}

export type CandidateFacetOptions = {
  locations: string[];
  skills: string[];
  certificates: string[];
  availability: string[];
  languages: string[];
};

export function emptyCandidateFacetOptions(): CandidateFacetOptions {
  return {
    locations: [],
    skills: [],
    certificates: [],
    availability: [],
    languages: [...COMMON_LANGUAGE_CHIPS],
  };
}

export function buildCandidateFacetOptions(candidates: DiscoverableCandidate[]): CandidateFacetOptions {
  const uniq = (arr: string[]) =>
    Array.from(new Set(arr.map((x) => x.trim()).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "et")
    );

  const locations: string[] = [];
  const skills: string[] = [];
  const certificates: string[] = [];
  const availability: string[] = [];
  const languages: string[] = [...COMMON_LANGUAGE_CHIPS];

  for (const c of candidates) {
    locations.push(...locationHaystack(c));
    skills.push(...c.skills);
    for (const cert of c.certificates) {
      if (cert.name.trim()) certificates.push(cert.name.trim());
    }
    if (c.hasBLicense) certificates.push("B-kategooria");
    availability.push(...c.preferredJobTypes);
    languages.push(...c.languages);
  }

  return {
    locations: uniq(locations).slice(0, 40),
    skills: uniq(skills).slice(0, 40),
    certificates: uniq(certificates).slice(0, 40),
    availability: uniq(availability).slice(0, 30),
    languages: uniq(languages).slice(0, 20),
  };
}

export function activeFilterCount(f: CandidateFilterState): number {
  let n = 0;
  if (f.query.trim()) n += 1;
  if (f.seekingFirstJob) n += 1;
  if (f.experienceNotRequired) n += 1;
  if (f.experienceYearsMin.trim() || f.experienceYearsMax.trim()) n += 1;
  if (f.partTime) n += 1;
  if (f.fullTime) n += 1;
  if (f.desiredHoursMin.trim() || f.desiredHoursMax.trim()) n += 1;
  if (f.dayWork) n += 1;
  if (f.eveningWork) n += 1;
  if (f.shiftWork) n += 1;
  if (f.weekendWork) n += 1;
  if (f.flexibleHours) n += 1;
  if (f.remote) n += 1;
  if (f.hybrid) n += 1;
  if (f.onSite) n += 1;
  n += f.locations.length;
  n += f.languages.length;
  n += f.certificates.length;
  n += f.skills.length;
  n += f.availability.length;
  if (f.accessibleWorkplace) n += 1;
  if (f.adaptedArrangement) n += 1;
  if (f.extraBreaks) n += 1;
  return n;
}
