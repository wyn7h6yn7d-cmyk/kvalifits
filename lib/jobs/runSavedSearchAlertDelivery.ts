import type { SupabaseClient } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";

import type { Job } from "@/components/jobs/types";
import { loadEmployerPublicRowsByIds } from "@/lib/companies/loadPublicEmployerFields";
import { sendEmailViaResend, type SendEmailResult } from "@/lib/email/resend";
import {
  canonicalJobTypeKey,
  canonicalWorkTypeKey,
} from "@/lib/jobs/mapPublishedJobToCard";
import {
  normalizeSavedSearchFilters,
  parseMinMatchPercent,
  parseSavedSearchFrequency,
  type SavedJobSearchRow,
  type SavedSearchSnapshot,
} from "@/lib/jobs/savedJobSearches";
import {
  parseSavedSearchLocale,
  planSavedSearchAlert,
  savedSearchAlertIsDue,
  savedSearchAlertsEmailEnabled,
  type SavedSearchAlertJob,
} from "@/lib/jobs/savedSearchAlertDelivery";
import {
  savedSearchAlertMessageKey,
  savedSearchAlertMessageValues,
} from "@/lib/jobs/savedSearchAlertCopy";
import { applyCompactJobMatches, getJobMatchesForSeeker } from "@/lib/matching/getJobMatchesForSeeker";
import { loadSeekerMatchContextWithClient } from "@/lib/matching/seekerMatchContext";
import { reportException, reportMessage } from "@/lib/monitoring/report";
import { SITE_ORIGIN } from "@/lib/seo/site";
import type { AppLocale } from "@/i18n/routing";

const SEARCH_SELECT =
  "id,seeker_user_id,name,query,filters,require_public_salary,min_match_percent,frequency,enabled,locale,search_fingerprint,notify_after,last_notified_at,created_at,updated_at";

const JOB_SELECT =
  "id,title,location,job_type,work_type,short_summary,required_skills,keywords,certificate_requirements,salary_min,salary_max,salary_currency,employer_profile_id,status,created_at,published_at,application_deadline,expires_at,experience_level_required,languages,industry_id,profession_id,skill_ids,certificate_ids,language_ids";

const JOB_SELECT_LEGACY =
  "id,title,location,job_type,work_type,short_summary,required_skills,keywords,certificate_requirements,salary_min,salary_max,salary_currency,employer_profile_id,status,created_at,published_at,application_deadline,expires_at,experience_level_required";

const SEARCH_LIMIT = 250;
const JOB_LIMIT = 400;

export type SavedSearchAlertRunSummary = {
  searchesConsidered: number;
  searchesNotified: number;
  jobsNotified: number;
  emailAttempted: number;
};

type SendAlertEmail = (args: {
  toEmail: string;
  locale: AppLocale;
  searchName: string;
  jobCount: number;
  minMatchApplied: number | null;
  deliveryKey: string;
  searchId: string;
}) => Promise<SendEmailResult>;

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

function toNum(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function uniqueViolation(error: { code?: string; message?: string } | null | undefined): boolean {
  const code = (error?.code ?? "").toString();
  const message = (error?.message ?? "").toLowerCase();
  return code === "23505" || message.includes("duplicate") || message.includes("unique");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function snapshotFromRow(row: SavedJobSearchRow): SavedSearchSnapshot {
  return {
    query: row.query,
    requirePublicSalary: row.require_public_salary,
    filters: normalizeSavedSearchFilters(row.filters),
  };
}

function mapAlertJob(
  row: Record<string, unknown>,
  companyName: string,
): SavedSearchAlertJob {
  const skills = asStringArray(row.required_skills);
  const keywords = asStringArray(row.keywords);
  const jobTypeRaw = (row.job_type ?? "").toString();
  const workTypeRaw = (row.work_type ?? "").toString();
  const publishedAt = ((row.published_at ?? row.created_at) as string | null) ?? null;
  const applicationDeadline = (row.application_deadline as string | null) ?? null;
  const expiresAt = (row.expires_at as string | null) ?? null;
  const experienceLevel = (row.experience_level_required ?? "").toString().trim() || null;
  return {
    id: String(row.id ?? ""),
    title: (row.title ?? "").toString().trim() || "—",
    company: companyName,
    location: (row.location ?? "").toString().trim() || "—",
    type: "—",
    jobType: canonicalJobTypeKey(jobTypeRaw) ?? (jobTypeRaw.trim() || undefined),
    workType: canonicalWorkTypeKey(workTypeRaw) ?? (workTypeRaw.trim() || undefined),
    summary: (row.short_summary ?? "").toString().trim() || undefined,
    salaryMin: toNum(row.salary_min),
    salaryMax: toNum(row.salary_max),
    createdAt: (row.created_at as string | undefined) ?? undefined,
    publishedAt,
    applicationDeadline,
    tags: Array.from(new Set([...skills, ...keywords])).slice(0, 10),
    skills,
    skillIds: asStringArray(row.skill_ids),
    requiredCerts: (row.certificate_requirements ?? "")
      .toString()
      .split(/[,;\n]/g)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 8),
    certificateIds: asStringArray(row.certificate_ids),
    domains: asStringArray(row.industry_id),
    industryId: (row.industry_id ?? "").toString().trim() || null,
    professionId: (row.profession_id ?? "").toString().trim() || null,
    languages: asStringArray(row.languages),
    languageIds: asStringArray(row.language_ids),
    experienceLevel,
    status: (row.status ?? "").toString(),
    published_at: publishedAt,
    application_deadline: applicationDeadline,
    expires_at: expiresAt,
  };
}

function parseSearchRow(raw: Record<string, unknown>): SavedJobSearchRow | null {
  const id = (raw.id ?? "").toString().trim();
  const seeker = (raw.seeker_user_id ?? "").toString().trim();
  if (!id || !seeker) return null;
  return {
    id,
    seeker_user_id: seeker,
    name: (raw.name ?? "").toString(),
    query: (raw.query ?? "").toString(),
    filters: normalizeSavedSearchFilters(raw.filters),
    require_public_salary: Boolean(raw.require_public_salary),
    min_match_percent: parseMinMatchPercent(raw.min_match_percent),
    frequency: parseSavedSearchFrequency(raw.frequency),
    enabled: raw.enabled !== false,
    locale: (raw.locale ?? "et").toString(),
    search_fingerprint: (raw.search_fingerprint ?? "").toString(),
    notify_after: (raw.notify_after ?? raw.created_at ?? new Date(0).toISOString()).toString(),
    last_notified_at: raw.last_notified_at ? String(raw.last_notified_at) : null,
    created_at: String(raw.created_at ?? ""),
    updated_at: String(raw.updated_at ?? raw.created_at ?? ""),
  };
}

async function loadPublishedAlertJobs(
  admin: SupabaseClient,
  publishedAfterIso: string,
): Promise<{ jobs: SavedSearchAlertJob[]; rawById: Map<string, Record<string, unknown>> }> {
  const full = await admin
    .from("job_posts")
    .select(JOB_SELECT)
    .eq("status", "published")
    .gt("published_at", publishedAfterIso)
    .order("published_at", { ascending: false })
    .limit(JOB_LIMIT);

  let rows: Record<string, unknown>[] = [];
  if (!full.error) {
    rows = (full.data ?? []) as Record<string, unknown>[];
  } else if (/column|published_at|expires_at|skill_ids/i.test(full.error.message ?? "")) {
    const legacy = await admin
      .from("job_posts")
      .select(JOB_SELECT_LEGACY)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(JOB_LIMIT);
    if (legacy.error) throw legacy.error;
    rows = (legacy.data ?? []) as Record<string, unknown>[];
  } else {
    throw full.error;
  }
  const employerIds = Array.from(
    new Set(rows.map((r) => (r.employer_profile_id ?? "").toString().trim()).filter(Boolean)),
  );
  const employers = await loadEmployerPublicRowsByIds(admin, employerIds);
  const companyById = new Map<string, string>();
  for (const [id, e] of employers) {
    companyById.set(id, (e.company_name ?? "—").toString());
  }

  const rawById = new Map<string, Record<string, unknown>>();
  const jobs: SavedSearchAlertJob[] = [];
  for (const row of rows) {
    const empId = (row.employer_profile_id ?? "").toString();
    const job = mapAlertJob(row, companyById.get(empId) ?? "—");
    if (!job.id) continue;
    jobs.push(job);
    rawById.set(job.id, row);
  }
  return { jobs, rawById };
}

async function alreadyNotifiedJobIds(
  admin: SupabaseClient,
  savedSearchId: string,
  jobIds: string[],
): Promise<Set<string>> {
  const ids = jobIds.filter(Boolean);
  if (!ids.length) return new Set();
  const { data, error } = await admin
    .from("saved_search_alert_deliveries")
    .select("job_post_id")
    .eq("saved_search_id", savedSearchId)
    .in("job_post_id", ids);
  if (error) {
    if (/does not exist|schema cache/i.test(error.message ?? "")) return new Set();
    throw error;
  }
  return new Set((data ?? []).map((r) => String((r as { job_post_id?: unknown }).job_post_id ?? "")).filter(Boolean));
}

function defaultSendAlertEmail(): SendAlertEmail {
  return async (args) => {
    const t = await getTranslations({ locale: args.locale, namespace: "savedSearches" });
    const values = savedSearchAlertMessageValues(args.jobCount, args.minMatchApplied);
    const body = t(savedSearchAlertMessageKey(args.minMatchApplied), values);
    const subject = t("emailSubject", { name: args.searchName || t("untitled") });
    const from = process.env.EMAIL_FROM || "no-reply@kvalifits.ee";
    const manageUrl = `${SITE_ORIGIN}/${args.locale}/account/seeker/alerts`;
    const html = `<p>${escapeHtml(body)}</p><p><a href="${escapeHtml(manageUrl)}">${escapeHtml(t("manageCta"))}</a></p>`;
    return sendEmailViaResend({
      from,
      to: args.toEmail,
      subject,
      html,
      idempotencyKey: `saved-search-alert:${args.searchId}:${args.deliveryKey}`,
    });
  };
}

export async function runSavedSearchAlertDelivery(opts: {
  admin: SupabaseClient;
  asOf?: Date;
  emailEnabled?: boolean;
  sendEmail?: SendAlertEmail;
}): Promise<SavedSearchAlertRunSummary> {
  const asOf = opts.asOf ?? new Date();
  const emailEnabled = opts.emailEnabled ?? savedSearchAlertsEmailEnabled();
  const sendEmail = opts.sendEmail ?? defaultSendAlertEmail();
  const summary: SavedSearchAlertRunSummary = {
    searchesConsidered: 0,
    searchesNotified: 0,
    jobsNotified: 0,
    emailAttempted: 0,
  };

  const searchesRes = await opts.admin
    .from("saved_job_searches")
    .select(SEARCH_SELECT)
    .eq("enabled", true)
    .limit(SEARCH_LIMIT);
  if (searchesRes.error) throw searchesRes.error;

  const searches = (searchesRes.data ?? [])
    .map((row) => parseSearchRow(row as Record<string, unknown>))
    .filter((row): row is SavedJobSearchRow => Boolean(row));
  summary.searchesConsidered = searches.length;
  if (!searches.length) return summary;

  const seekerIds = Array.from(new Set(searches.map((s) => s.seeker_user_id)));
  const blocked = new Set<string>();
  {
    const { data, error } = await opts.admin.from("profiles").select("id,is_blocked").in("id", seekerIds);
    if (!error) {
      for (const row of data ?? []) {
        if ((row as { is_blocked?: boolean }).is_blocked) {
          blocked.add(String((row as { id?: string }).id ?? ""));
        }
      }
    }
  }

  const due = searches.filter(
    (s) =>
      !blocked.has(s.seeker_user_id) &&
      savedSearchAlertIsDue({
        enabled: s.enabled,
        frequency: s.frequency,
        lastNotifiedAt: s.last_notified_at,
        asOf,
      }),
  );
  if (!due.length) return summary;

  const oldestCursor = due.reduce((min, s) => (s.notify_after < min ? s.notify_after : min), due[0].notify_after);
  const { jobs, rawById } = await loadPublishedAlertJobs(opts.admin, oldestCursor);
  const jobInputs = rawById;

  const bySeeker = new Map<string, SavedJobSearchRow[]>();
  for (const search of due) {
    const list = bySeeker.get(search.seeker_user_id) ?? [];
    list.push(search);
    bySeeker.set(search.seeker_user_id, list);
  }

  const emailByUser = new Map<string, string>();
  if (emailEnabled) {
    for (const seekerId of bySeeker.keys()) {
      try {
        const { data } = await opts.admin.auth.admin.getUserById(seekerId);
        const email = (data.user?.email ?? "").trim();
        if (email) emailByUser.set(seekerId, email);
      } catch (err) {
        reportException(err, { area: "email", code: "saved_search_alert_email_lookup" });
      }
    }
  }

  for (const [seekerId, seekerSearches] of bySeeker) {
    const context = await loadSeekerMatchContextWithClient(opts.admin, seekerId);
    const matched = await getJobMatchesForSeeker({
      supabase: opts.admin,
      userId: seekerId,
      jobIds: jobs.map((j) => j.id),
      context,
      jobInputs,
    });
    const matchingAvailable = matched.matchSortAvailable;
    const scoredJobs: Job[] = matchingAvailable ? applyCompactJobMatches(jobs, matched.byId) : jobs;

    for (const search of seekerSearches) {
      const candidateIds = scoredJobs.map((j) => j.id);
      const notified = await alreadyNotifiedJobIds(opts.admin, search.id, candidateIds);
      const plan = planSavedSearchAlert(
        {
          enabled: search.enabled,
          frequency: search.frequency,
          last_notified_at: search.last_notified_at,
          notify_after: search.notify_after,
          locale: search.locale,
          min_match_percent: search.min_match_percent,
          matchingAvailable,
          alreadyNotifiedJobIds: notified,
          asOf,
        },
        scoredJobs as SavedSearchAlertJob[],
        snapshotFromRow(search),
      );
      if (plan.kind !== "deliver") continue;

      const jobIds = plan.jobs.map((j) => j.id);
      const firstJobId = jobIds[0] ?? null;
      const payload: Record<string, unknown> = {
        count: jobIds.length,
        delivery_key: plan.deliveryKey,
        job_post_id: firstJobId,
      };
      if (plan.minMatchApplied != null) payload.threshold = plan.minMatchApplied;

      const insertNotif = await opts.admin.from("notifications").insert({
        user_id: seekerId,
        type: "saved_search_alert",
        entity_type: "saved_job_search",
        entity_id: search.id,
        payload,
      });
      if (insertNotif.error && !uniqueViolation(insertNotif.error)) {
        reportMessage("saved_search_alert_notification_failed", {
          area: "api",
          code: "saved_search_alert_notification_failed",
        });
        continue;
      }

      const deliveryRows = jobIds.map((jobPostId) => ({
        saved_search_id: search.id,
        job_post_id: jobPostId,
        seeker_user_id: seekerId,
      }));
      const insertHist = await opts.admin.from("saved_search_alert_deliveries").insert(deliveryRows);
      if (insertHist.error && !uniqueViolation(insertHist.error)) {
        reportMessage("saved_search_alert_history_failed", {
          area: "api",
          code: "saved_search_alert_history_failed",
        });
        continue;
      }

      const stamped = asOf.toISOString();
      await opts.admin
        .from("saved_job_searches")
        .update({ last_notified_at: stamped, notify_after: stamped, updated_at: stamped })
        .eq("id", search.id);

      summary.searchesNotified += 1;
      summary.jobsNotified += jobIds.length;

      if (emailEnabled) {
        const toEmail = emailByUser.get(seekerId);
        if (toEmail) {
          summary.emailAttempted += 1;
          try {
            await sendEmail({
              toEmail,
              locale: parseSavedSearchLocale(search.locale),
              searchName: search.name,
              jobCount: jobIds.length,
              minMatchApplied: plan.minMatchApplied,
              deliveryKey: plan.deliveryKey,
              searchId: search.id,
            });
          } catch (err) {
            reportException(err, { area: "email", code: "saved_search_alert_email" });
          }
        }
      }
    }
  }

  return summary;
}
