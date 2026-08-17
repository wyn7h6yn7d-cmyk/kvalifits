/**
 * Job listing lifecycle dates: published_at, application_deadline, expires_at.
 * Expired listings are archived (inactive), never auto-deleted.
 */

export type JobLifecycleDates = {
  status?: string | null;
  published_at?: string | null;
  application_deadline?: string | null;
  expires_at?: string | null;
};

const TALLINN_TZ = "Europe/Tallinn";

/** Calendar YYYY-MM-DD in Europe/Tallinn. */
export function calendarDateInTallinn(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TALLINN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Normalize DB date / timestamptz to YYYY-MM-DD (Tallinn calendar day). */
export function toCalendarDate(raw: string | null | undefined): string | null {
  const s = (raw ?? "").toString().trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return calendarDateInTallinn(d);
}

/** True when the calendar day is strictly before today (Tallinn). */
export function isCalendarDatePast(raw: string | null | undefined, asOf: Date = new Date()): boolean {
  const day = toCalendarDate(raw);
  if (!day) return false;
  return day < calendarDateInTallinn(asOf);
}

/** True when timestamptz is strictly before `asOf`. */
export function isTimestampPast(raw: string | null | undefined, asOf: Date = new Date()): boolean {
  const s = (raw ?? "").toString().trim();
  if (!s) return false;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    // date-only: treat as past after that calendar day ends
    return isCalendarDatePast(s, asOf);
  }
  return d.getTime() < asOf.getTime();
}

export function isListingExpired(job: JobLifecycleDates, asOf: Date = new Date()): boolean {
  if (isTimestampPast(job.expires_at, asOf)) return true;
  // If only deadline exists (legacy), treat past deadline as expired for apply purposes.
  if (!job.expires_at && isCalendarDatePast(job.application_deadline, asOf)) return true;
  return false;
}

export function isApplicationDeadlinePassed(job: JobLifecycleDates, asOf: Date = new Date()): boolean {
  return isCalendarDatePast(job.application_deadline, asOf);
}

/** Seekers may apply only while published and neither expiry nor deadline has passed. */
export function jobAcceptsApplications(job: JobLifecycleDates, asOf: Date = new Date()): boolean {
  if ((job.status ?? "").toString() !== "published") return false;
  if (isListingExpired(job, asOf)) return false;
  if (isApplicationDeadlinePassed(job, asOf)) return false;
  return true;
}

/** Prefer application_deadline for “Kandideeri kuni”; fall back to expires_at calendar day. */
export function applyUntilDate(job: JobLifecycleDates): string | null {
  return toCalendarDate(job.application_deadline) || toCalendarDate(job.expires_at);
}

/** Display as DD.MM.YYYY (e.g. 31.08.2026). */
export function formatJobDateDdMmYyyy(raw: string | null | undefined): string | null {
  const day = toCalendarDate(raw);
  if (!day) return null;
  const [y, m, d] = day.split("-");
  return `${d}.${m}.${y}`;
}

export function formatApplyUntilLabel(
  job: JobLifecycleDates,
  t: (key: string, values?: Record<string, string>) => string
): string | null {
  const formatted = formatJobDateDdMmYyyy(applyUntilDate(job));
  if (!formatted) return null;
  return t("jobApplyUntil", { date: formatted });
}

/** Whole calendar days from today (Tallinn) until `raw`. Negative = already past. */
export function daysUntilCalendarDate(raw: string | null | undefined, asOf: Date = new Date()): number | null {
  const day = toCalendarDate(raw);
  if (!day) return null;
  const today = calendarDateInTallinn(asOf);
  const start = Date.parse(`${today}T00:00:00Z`);
  const end = Date.parse(`${day}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.round((end - start) / (24 * 60 * 60 * 1000));
}

/** Add N calendar days to a YYYY-MM-DD (UTC date arithmetic on the calendar parts). */
export function addCalendarDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * End of listing day as ISO timestamptz (23:59:59.999 in Europe/Tallinn).
 * Uses fixed +03:00 / +02:00 via Intl offset when possible; fallback +02:00.
 */
export function endOfDayTallinnIso(ymd: string): string {
  // Estonia observes EET (+02) / EEST (+03). Noon probe picks the correct offset.
  const probe = new Date(`${ymd}T12:00:00+00:00`);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TALLINN_TZ,
    timeZoneName: "longOffset",
  });
  const tzPart = fmt.formatToParts(probe).find((p) => p.type === "timeZoneName")?.value ?? "GMT+02:00";
  const m = tzPart.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
  const sign = m?.[1] === "-" ? "-" : "+";
  const hh = String(m ? Number(m[2]) : 2).padStart(2, "0");
  const mm = String(m?.[3] ? Number(m[3]) : 0).padStart(2, "0");
  return `${ymd}T23:59:59.999${sign}${hh}:${mm}`;
}

export type ListingPackageDays = 30 | 90;

export function buildPublishLifecycleDates(opts: {
  publishedAt?: Date;
  /** Listing live duration in days (package). */
  packageDays: ListingPackageDays;
  /** Optional explicit application deadline YYYY-MM-DD; defaults to expiry day. */
  applicationDeadline?: string | null;
}): {
  published_at: string;
  application_deadline: string;
  expires_at: string;
} {
  const publishedAt = opts.publishedAt ?? new Date();
  const published_at = publishedAt.toISOString();
  const startDay = calendarDateInTallinn(publishedAt);
  const expiryDay = addCalendarDays(startDay, opts.packageDays);
  const requested = toCalendarDate(opts.applicationDeadline);
  let application_deadline = expiryDay;
  if (requested && requested >= startDay) {
    application_deadline = requested > expiryDay ? expiryDay : requested;
  }

  return {
    published_at,
    application_deadline,
    expires_at: endOfDayTallinnIso(expiryDay),
  };
}
