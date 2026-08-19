export const EDUCATION_LEVELS = [
  "basic",
  "vocational",
  "secondary",
  "vocational_secondary",
  "applied_higher",
  "bachelor",
  "master",
  "doctoral",
  "other",
] as const;

export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export const EDUCATION_MIN_YEAR = 1950;
export const EDUCATION_MAX_YEAR_CAP = 2100;
export const EDUCATION_INSTITUTION_MAX = 120;
export const EDUCATION_FIELD_MAX = 120;
export const EDUCATION_DESCRIPTION_MAX = 400;
export const EDUCATION_MAX_ROWS = 20;

export type SeekerEducationRow = {
  id: string;
  seeker_user_id: string;
  institution: string;
  field_of_study: string | null;
  degree_or_level: EducationLevel;
  start_year: number;
  end_year: number | null;
  currently_studying: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type SeekerEducationInput = {
  institution?: unknown;
  field_of_study?: unknown;
  degree_or_level?: unknown;
  start_year?: unknown;
  end_year?: unknown;
  currently_studying?: unknown;
  description?: unknown;
};

export type SeekerEducationValidationError =
  | "institution_required"
  | "institution_too_long"
  | "field_too_long"
  | "degree_required"
  | "year_invalid"
  | "year_order"
  | "current_has_end"
  | "description_too_long"
  | "too_many";

export function isEducationLevel(v: unknown): v is EducationLevel {
  return typeof v === "string" && (EDUCATION_LEVELS as readonly string[]).includes(v);
}

export function educationMaxYear(asOf: Date = new Date()): number {
  return Math.min(EDUCATION_MAX_YEAR_CAP, asOf.getUTCFullYear() + 1);
}

function parseYear(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isInteger(n)) return null;
  return n;
}

export function validateSeekerEducationInput(
  input: SeekerEducationInput,
  asOf: Date = new Date(),
): { ok: true; value: Omit<SeekerEducationRow, "id" | "seeker_user_id" | "created_at" | "updated_at"> } | {
  ok: false;
  error: SeekerEducationValidationError;
} {
  const institution = (input.institution ?? "").toString().trim();
  if (institution.length < 2) return { ok: false, error: "institution_required" };
  if (institution.length > EDUCATION_INSTITUTION_MAX) return { ok: false, error: "institution_too_long" };

  const fieldRaw = (input.field_of_study ?? "").toString().trim();
  if (fieldRaw.length > EDUCATION_FIELD_MAX) return { ok: false, error: "field_too_long" };

  if (!isEducationLevel(input.degree_or_level)) return { ok: false, error: "degree_required" };

  const currently = Boolean(input.currently_studying);
  const startYear = parseYear(input.start_year);
  const endYear = currently ? null : parseYear(input.end_year);
  const maxYear = educationMaxYear(asOf);
  if (startYear == null || startYear < EDUCATION_MIN_YEAR || startYear > maxYear) {
    return { ok: false, error: "year_invalid" };
  }
  if (endYear != null && (endYear < EDUCATION_MIN_YEAR || endYear > maxYear)) {
    return { ok: false, error: "year_invalid" };
  }
  if (!currently && endYear != null && startYear > endYear) return { ok: false, error: "year_order" };
  if (currently && parseYear(input.end_year) != null) return { ok: false, error: "current_has_end" };

  const description = (input.description ?? "").toString().trim();
  if (description.length > EDUCATION_DESCRIPTION_MAX) return { ok: false, error: "description_too_long" };

  return {
    ok: true,
    value: {
      institution,
      field_of_study: fieldRaw || null,
      degree_or_level: input.degree_or_level,
      start_year: startYear,
      end_year: endYear,
      currently_studying: currently,
      description: description || null,
    },
  };
}

export function canAddEducationRow(existingCount: number): boolean {
  return existingCount < EDUCATION_MAX_ROWS;
}

export function educationPeriodLabel(row: {
  start_year: number;
  end_year: number | null;
  currently_studying: boolean;
}): string {
  if (row.currently_studying || row.end_year == null) return `${row.start_year}–`;
  if (row.end_year === row.start_year) return String(row.start_year);
  return `${row.start_year}–${row.end_year}`;
}

export function isEducationTableMissing(message?: string | null): boolean {
  return /does not exist|schema cache|relation|could not find/i.test(message ?? "");
}

export type SeekerEducationShareRow = {
  institution: string;
  field_of_study: string | null;
  degree_or_level: EducationLevel;
  start_year: number;
  end_year: number | null;
  currently_studying: boolean;
  description: string | null;
};

export function parseEducationRows(raw: unknown): SeekerEducationShareRow[] {
  if (!Array.isArray(raw)) return [];
  const out: SeekerEducationShareRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const parsed = validateSeekerEducationInput(item as SeekerEducationInput);
    if (!parsed.ok) continue;
    out.push(parsed.value);
  }
  return sortEducationRows(out).slice(0, EDUCATION_MAX_ROWS);
}

export function coerceEducationRows(raw: unknown): SeekerEducationRow[] {
  if (!Array.isArray(raw)) return [];
  const out: SeekerEducationRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const parsed = validateSeekerEducationInput(rec);
    if (!parsed.ok) continue;
    const id = typeof rec.id === "string" ? rec.id : "";
    if (!id) continue;
    out.push({
      id,
      seeker_user_id: typeof rec.seeker_user_id === "string" ? rec.seeker_user_id : "",
      ...parsed.value,
      created_at: typeof rec.created_at === "string" ? rec.created_at : "",
      updated_at: typeof rec.updated_at === "string" ? rec.updated_at : "",
    });
  }
  return sortEducationRows(out).slice(0, EDUCATION_MAX_ROWS);
}

export function sortEducationRows<T extends { start_year: number; end_year: number | null; currently_studying: boolean }>(
  rows: readonly T[],
): T[] {
  return [...rows].sort((a, b) => {
    if (a.currently_studying !== b.currently_studying) return a.currently_studying ? -1 : 1;
    const aEnd = a.end_year ?? 9999;
    const bEnd = b.end_year ?? 9999;
    if (aEnd !== bEnd) return bEnd - aEnd;
    return b.start_year - a.start_year;
  });
}

export function educationSnapshotForShare(rows: readonly SeekerEducationRow[]) {
  return sortEducationRows(rows).map((row) => ({
    institution: row.institution,
    field_of_study: row.field_of_study,
    degree_or_level: row.degree_or_level,
    start_year: row.start_year,
    end_year: row.end_year,
    currently_studying: row.currently_studying,
    description: row.description,
  }));
}
