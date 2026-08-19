/**
 * Job listing SEO helpers (title, description, canonical, Open Graph, JobPosting JSON-LD).
 * Structured data includes only fields present on the published listing.
 */

import {
  applyUntilDate,
  endOfDayTallinnIso,
  jobAcceptsApplications,
} from "@/lib/jobs/jobLifecycle";
import {
  SITE_NAME,
  SITE_ORIGIN,
  absoluteUrl,
  hreflangLanguages,
  localeAlternates,
  ogAlternateLocales,
  ogLocaleTag,
} from "@/lib/seo/site";
import { safeHttpUrl } from "@/lib/utils";

export const JOB_SEO_SITE_ORIGIN = SITE_ORIGIN;
export const JOB_SEO_SITE_NAME = SITE_NAME;

export type JobSeoLocale = "et" | "en" | "ru";

export type JobSeoJobRow = {
  id: string;
  title?: string | null;
  location?: string | null;
  job_type?: string | null;
  work_type?: string | null;
  short_summary?: string | null;
  description?: string | null;
  status?: string | null;
  created_at?: string | null;
  published_at?: string | null;
  application_deadline?: string | null;
  expires_at?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  salary_period?: string | null;
  salary_tax?: string | null;
};

export type JobSeoEmployerRow = {
  company_name?: string | null;
  website?: string | null;
  logo_url?: string | null;
  location?: string | null;
  public_slug?: string | null;
};

function trimText(v: unknown): string {
  return (v ?? "").toString().trim();
}

function stripHtmlish(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Rough Estonian inessive for short place names (Tallinn → Tallinnas). */
export function formatLocationForEtTitle(location: string): string {
  const loc = location.trim();
  if (!loc) return "";
  const last = loc.split(/[\s,/-]+/).filter(Boolean).pop() ?? loc;
  if (/[sS]$/.test(last) || /(sse|sse)$/i.test(last)) return loc;
  if (/[aeiouäöüõyAEIOUÄÖÜÕY]$/.test(last)) return `${loc}s`;
  return `${loc}as`;
}

export function buildJobSeoTitle(opts: {
  locale: string;
  title: string;
  location: string;
  companyName: string;
  emptyTitle: string;
}): string {
  const title = opts.title.trim() || opts.emptyTitle;
  const company = opts.companyName.trim() || "Kvalifits";
  const loc = opts.location.trim();
  const locale = opts.locale;

  let mid = title;
  if (loc) {
    if (locale === "en") mid = `${title} in ${loc}`;
    else if (locale === "ru") mid = `${title} — ${loc}`;
    else mid = `${title} ${formatLocationForEtTitle(loc)}`;
  }

  return `${mid} – ${company} | ${JOB_SEO_SITE_NAME}`;
}

export function buildJobSeoDescription(opts: {
  title: string;
  location: string;
  companyName: string;
  shortSummary: string;
  description: string;
  emptyDescription: string;
}): string {
  const summary = stripHtmlish(opts.shortSummary);
  const desc = stripHtmlish(opts.description);
  const base = summary || desc;
  if (base) {
    return base.length > 160 ? `${base.slice(0, 157).trimEnd()}…` : base;
  }

  const parts = [opts.title.trim(), opts.companyName.trim(), opts.location.trim()].filter(Boolean);
  return parts.join(" · ").slice(0, 160) || opts.emptyDescription;
}

export function jobCanonicalUrl(locale: string, jobId: string): string {
  return absoluteUrl(locale, `/tood/${jobId}`);
}

export function jobLocaleAlternates(locale: string, jobId: string) {
  return localeAlternates(locale, `/tood/${jobId}`);
}

export function jobHreflangLanguages(jobId: string) {
  return hreflangLanguages(`/tood/${jobId}`);
}

function mapEmploymentType(jobType: string | null | undefined): string | undefined {
  const v = (jobType ?? "").toString().trim().toLowerCase().replace(/-/g, "_");
  if (!v) return undefined;
  if (v === "full_time") return "FULL_TIME";
  if (v === "part_time") return "PART_TIME";
  if (v === "contract") return "CONTRACTOR";
  if (v === "internship") return "INTERN";
  if (v === "temporary" || v === "temp") return "TEMPORARY";
  return undefined;
}

function mapSalaryUnitText(period: string | null | undefined): string | undefined {
  const v = (period ?? "").toString().trim().toLowerCase();
  if (v === "hour") return "HOUR";
  if (v === "month") return "MONTH";
  if (v === "year") return "YEAR";
  if (v === "week") return "WEEK";
  if (v === "day") return "DAY";
  return undefined;
}

function toIsoDate(v: unknown): string | undefined {
  const raw = (v ?? "").toString().trim();
  if (!raw) return undefined;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    // date-only YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    return undefined;
  }
  return d.toISOString();
}

/**
 * Google JobPosting JSON-LD. Omits properties that are missing from the listing.
 */
export function buildJobPostingJsonLd(opts: {
  locale: string;
  job: JobSeoJobRow;
  employer: JobSeoEmployerRow | null;
}): Record<string, unknown> | null {
  if (!jobAcceptsApplications(opts.job)) return null;

  const title = trimText(opts.job.title);
  if (!title) return null;

  const summary = stripHtmlish(trimText(opts.job.short_summary));
  const body = stripHtmlish(trimText(opts.job.description));
  const descriptionRaw = [summary, body].filter(Boolean).join("\n\n");
  if (!descriptionRaw) return null;

  const companyName = trimText(opts.employer?.company_name);
  if (!companyName) return null;

  const datePosted =
    toIsoDate(opts.job.published_at) || toIsoDate(opts.job.created_at);
  if (!datePosted) return null;

  const location = trimText(opts.job.location);
  const workType = trimText(opts.job.work_type).toLowerCase().replace(/-/g, "_");
  const isRemote = workType === "remote";

  const hiringOrganization: Record<string, unknown> = {
    "@type": "Organization",
    name: companyName,
  };
  const publicSlug = trimText(opts.employer?.public_slug);
  if (publicSlug) {
    hiringOrganization.url = absoluteUrl(opts.locale, `/ettevotted/${publicSlug}`);
  }
  const website = safeHttpUrl(opts.employer?.website);
  if (website) {
    hiringOrganization.sameAs = website;
    if (!hiringOrganization.url) hiringOrganization.url = website;
  }
  const logo = safeHttpUrl(opts.employer?.logo_url);
  if (logo) hiringOrganization.logo = logo;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title,
    description: descriptionRaw,
    datePosted,
    hiringOrganization,
    identifier: {
      "@type": "PropertyValue",
      name: JOB_SEO_SITE_NAME,
      value: opts.job.id,
    },
    url: jobCanonicalUrl(opts.locale, opts.job.id),
  };

  const untilDay = applyUntilDate(opts.job);
  if (untilDay) jsonLd.validThrough = endOfDayTallinnIso(untilDay);

  const employmentType = mapEmploymentType(opts.job.job_type);
  if (employmentType) jsonLd.employmentType = employmentType;

  if (isRemote) {
    jsonLd.jobLocationType = "TELECOMMUTE";
  }
  if (location) {
    jsonLd.jobLocation = {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: location,
      },
    };
  } else if (!isRemote) {
    // Google requires jobLocation or TELECOMMUTE — without either, skip structured data.
    return null;
  }

  const min = typeof opts.job.salary_min === "number" ? opts.job.salary_min : null;
  const max = typeof opts.job.salary_max === "number" ? opts.job.salary_max : null;
  const currency = trimText(opts.job.salary_currency).toUpperCase();
  const unitText = mapSalaryUnitText(opts.job.salary_period);

  // Only emit salary when amount + currency + period all exist on the listing.
  if ((min != null || max != null) && currency && unitText) {
    const value: Record<string, unknown> = {
      "@type": "QuantitativeValue",
      unitText,
    };
    if (min != null && max != null && min === max) {
      value.value = min;
    } else {
      if (min != null) value.minValue = min;
      if (max != null) value.maxValue = max;
    }
    jsonLd.baseSalary = {
      "@type": "MonetaryAmount",
      currency,
      value,
    };
  }

  // Hybrid: on-site location + note — Google allows jobLocation with hybrid; we keep place only.
  // Do not invent applicantLocationRequirements / experienceRequirements / etc.

  return jsonLd;
}

export function buildJobOpenGraph(opts: {
  locale: string;
  title: string;
  description: string;
  canonical: string;
  logoUrl?: string | null;
}): {
  title: string;
  description: string;
  url: string;
  siteName: string;
  locale: string;
  alternateLocale: string[];
  type: "website";
  images?: { url: string }[];
} {
  const logo = trimText(opts.logoUrl);
  const images =
    logo && (logo.startsWith("http://") || logo.startsWith("https://"))
      ? [{ url: logo }]
      : undefined;

  return {
    title: opts.title,
    description: opts.description,
    url: opts.canonical,
    siteName: JOB_SEO_SITE_NAME,
    locale: ogLocaleTag(opts.locale),
    alternateLocale: ogAlternateLocales(opts.locale),
    type: "website",
    ...(images ? { images } : {}),
  };
}
