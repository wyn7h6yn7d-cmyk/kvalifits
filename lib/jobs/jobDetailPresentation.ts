export function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function mapWorkTypeLabel(raw: string, tJobs: (key: string) => string) {
  const v = raw.trim().toLowerCase().replace(/-/g, "_");
  if (!v) return "";
  if (v === "on_site" || v === "onsite") return tJobs("workTypeOnSite");
  if (v === "hybrid") return tJobs("workTypeHybrid");
  if (v === "remote") return tJobs("workTypeRemote");
  return raw.trim();
}

export function mapJobTypeLabel(raw: string, tJobs: (key: string) => string) {
  const v = raw.trim();
  if (v === "full_time") return tJobs("jobTypeFullTime");
  if (v === "part_time") return tJobs("jobTypePartTime");
  if (v === "contract") return tJobs("jobTypeContract");
  if (v === "internship") return tJobs("jobTypeInternship");
  return v.replaceAll("_", " ");
}

export function formatOptionalDate(raw: unknown, locale: string): string | null {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (!s) return null;
  const d = new Date(s.length <= 10 ? `${s}T12:00:00` : s);
  if (Number.isNaN(d.getTime())) return s.slice(0, 10);
  const tag = locale === "en" ? "en-GB" : locale === "ru" ? "ru-RU" : "et-EE";
  return d.toLocaleDateString(tag, { year: "numeric", month: "short", day: "numeric" });
}

const LANG_LINE_HINT =
  /\b(eesti|inglise|vene|soome|saksa|prantsuse|hispaania|rootsi|läti|leedu|estonian|english|russian|finnish|german|french|spanish|swedish|latvian|lithuanian|keeleoskus|language|язык|эстон|англий|русск)\b/i;

export function collectSkillLines(input: { required_skills: string[] | null; exclude: string[] }): string[] {
  const skip = new Set(input.exclude.map((x) => x.trim().toLowerCase()).filter(Boolean));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input.required_skills ?? []) {
    const line = String(raw).trim();
    if (!line) continue;
    const key = line.toLowerCase();
    if (skip.has(key) || LANG_LINE_HINT.test(line) || seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out;
}

export function splitCertLines(raw: string): string[] {
  const parts = raw
    .split(/[,;\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of parts) {
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out;
}

export function collectLanguageLines(input: {
  required_skills: string[] | null;
  keywords: string[] | null;
}): string[] {
  const pool = [...(input.required_skills ?? []), ...(input.keywords ?? [])]
    .map((x) => String(x).trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of pool) {
    if (!LANG_LINE_HINT.test(line)) continue;
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out;
}

export function buildScheduleLines(
  job: {
    weekly_hours?: unknown;
    daily_hours?: unknown;
    shift_start?: unknown;
    shift_end?: unknown;
    includes_night_work?: unknown;
    is_hazardous_work?: unknown;
  },
  tJobs: (key: string, values?: Record<string, number | string>) => string,
  startLabel: string | null,
): string[] {
  const lines: string[] = [];
  const weekly = toNum(job.weekly_hours);
  const daily = toNum(job.daily_hours);
  const start = job.shift_start ? String(job.shift_start).slice(0, 5) : "";
  const end = job.shift_end ? String(job.shift_end).slice(0, 5) : "";
  if (weekly !== null) lines.push(tJobs("jobScheduleWeeklyHours", { hours: weekly }));
  if (daily !== null) lines.push(tJobs("jobScheduleDailyHours", { hours: daily }));
  if (start && end) lines.push(tJobs("jobDetailShiftRange", { start, end }));
  else if (start) lines.push(start);
  else if (end) lines.push(end);
  if (job.includes_night_work === true) lines.push(tJobs("includesNightWork"));
  if (job.is_hazardous_work === true) lines.push(tJobs("isHazardousWork"));
  if (startLabel) lines.push(`${tJobs("jobDetailMetaStart")}: ${startLabel}`);
  return lines;
}

export function buildScheduleHint(
  job: {
    weekly_hours?: unknown;
    daily_hours?: unknown;
    shift_start?: unknown;
    shift_end?: unknown;
    job_type?: unknown;
  },
  tJobs: (key: string, values?: Record<string, number | string>) => string,
): string | null {
  const parts: string[] = [];
  const weekly = toNum(job.weekly_hours);
  const daily = toNum(job.daily_hours);
  const start = job.shift_start ? String(job.shift_start).slice(0, 5) : "";
  const end = job.shift_end ? String(job.shift_end).slice(0, 5) : "";
  if (weekly !== null) parts.push(tJobs("jobScheduleWeeklyHours", { hours: weekly }));
  if (daily !== null) parts.push(tJobs("jobScheduleDailyHours", { hours: daily }));
  if (start && end) parts.push(`${start}–${end}`);
  if (job.job_type) parts.push(mapJobTypeLabel(String(job.job_type), tJobs));
  return parts.length ? parts.join(" · ") : null;
}
