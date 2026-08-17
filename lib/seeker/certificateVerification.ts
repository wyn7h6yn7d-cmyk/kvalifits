/**
 * Seeker certificate verification + validity lifecycle.
 * Uploads start as `submitted` — never auto-marked verified.
 * Expiry is derived from `certificate_valid_until` without deleting verification history.
 */

export const CERTIFICATE_VERIFICATION_STATUS_VALUES = [
  "submitted",
  "under_review",
  "verified",
  "rejected",
] as const;

export type CertificateVerificationStatus = (typeof CERTIFICATE_VERIFICATION_STATUS_VALUES)[number];

/** UI / matching effective status — includes derived `expired`. */
export const CERTIFICATE_EFFECTIVE_STATUS_VALUES = [
  ...CERTIFICATE_VERIFICATION_STATUS_VALUES,
  "expired",
] as const;

export type CertificateEffectiveStatus = (typeof CERTIFICATE_EFFECTIVE_STATUS_VALUES)[number];

/** Warn this many calendar days before valid_until (inclusive). */
export const CERTIFICATE_EXPIRY_WARN_DAYS = 30;

export type CertificateVerificationFields = {
  verification_status: CertificateVerificationStatus;
  verified_at: string | null;
  verification_source: string | null;
  verified_by: string | null;
  certificate_valid_until: string | null;
};

export function isCertificateVerificationStatus(v: unknown): v is CertificateVerificationStatus {
  return typeof v === "string" && (CERTIFICATE_VERIFICATION_STATUS_VALUES as readonly string[]).includes(v);
}

export function parseCertificateVerificationStatus(v: unknown): CertificateVerificationStatus {
  return isCertificateVerificationStatus(v) ? v : "submitted";
}

/** Stable key to preserve verification when the seeker re-saves the same cert. */
export function certificateIdentityKey(name: string, issuer: string): string {
  return `${name.trim().toLowerCase()}::${issuer.trim().toLowerCase()}`;
}

/** Parse `YYYY-MM-DD` (or ISO prefix) to UTC calendar date; null if missing/invalid. */
export function parseCertificateValidUntilDate(iso: string | null | undefined): Date | null {
  const raw = (iso ?? "").toString().trim();
  if (!raw) return null;
  const day = raw.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  if (
    Number.isNaN(dt.getTime()) ||
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m! - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return dt;
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** True when valid_until is set and that calendar day is strictly before `asOf`'s UTC day. */
export function isCertificateExpired(
  validUntil: string | null | undefined,
  asOf: Date = new Date()
): boolean {
  const until = parseCertificateValidUntilDate(validUntil);
  if (!until) return false;
  return until.getTime() < startOfUtcDay(asOf).getTime();
}

/**
 * Days from asOf (UTC day) until valid_until inclusive.
 * Negative = already expired. Null = no expiry date.
 */
export function daysUntilCertificateExpiry(
  validUntil: string | null | undefined,
  asOf: Date = new Date()
): number | null {
  const until = parseCertificateValidUntilDate(validUntil);
  if (!until) return null;
  const start = startOfUtcDay(asOf).getTime();
  const end = until.getTime();
  return Math.round((end - start) / (24 * 60 * 60 * 1000));
}

/** Expiring soon but not yet expired. */
export function isCertificateExpiringSoon(
  validUntil: string | null | undefined,
  asOf: Date = new Date(),
  warnWithinDays: number = CERTIFICATE_EXPIRY_WARN_DAYS
): boolean {
  const days = daysUntilCertificateExpiry(validUntil, asOf);
  if (days === null) return false;
  return days >= 0 && days <= warnWithinDays;
}

/**
 * Effective status for UI. Expired certificates lose “verified & valid”
 * while verification history fields remain on the record.
 */
export function resolveCertificateEffectiveStatus(
  fields: Pick<CertificateVerificationFields, "verification_status" | "certificate_valid_until">,
  asOf: Date = new Date()
): CertificateEffectiveStatus {
  if (isCertificateExpired(fields.certificate_valid_until, asOf)) return "expired";
  return parseCertificateVerificationStatus(fields.verification_status);
}

/**
 * Matching / requirement fulfilment: expired certificates do not count.
 * Missing expiry date is treated as still valid for matching.
 */
export function isCertificateValidForMatching(
  validUntil: string | null | undefined,
  asOf: Date = new Date()
): boolean {
  return !isCertificateExpired(validUntil, asOf);
}

function formatIsoDateDisplay(iso: string | null | undefined, locale: string): string | null {
  const raw = (iso ?? "").toString().trim();
  if (!raw) return null;
  const day = raw.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return raw;
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  if (Number.isNaN(dt.getTime())) return day;
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }).format(dt);
  } catch {
    return day;
  }
}

export type CertificateStatusLabels = {
  submitted: string;
  under_review: string;
  verified: string;
  rejected: string;
  expired: string;
};

export type CertificateVerificationViewLabels = CertificateStatusLabels & {
  source: (source: string) => string;
  verifiedOn: (date: string) => string;
  validUntil: (date: string) => string;
  previouslyVerified?: string;
};

export type CertificateVerificationView = {
  status: CertificateEffectiveStatus;
  statusLabel: string;
  sourceLine: string | null;
  verifiedOnLine: string | null;
  validUntilLine: string | null;
};

function certificateStatusLabel(
  status: CertificateEffectiveStatus,
  labels: CertificateStatusLabels,
): string {
  return labels[status];
}

/**
 * Status word only — never “Kontrollitud” from an upload.
 * Extra facts (source, dates) live on {@link buildCertificateVerificationView}.
 */
export function formatCertificateStatusLine(
  fields: Pick<CertificateVerificationFields, "verification_status" | "certificate_valid_until">,
  labels: CertificateStatusLabels,
  _locale?: string,
  asOf: Date = new Date(),
): string {
  return certificateStatusLabel(resolveCertificateEffectiveStatus(fields, asOf), labels);
}

/**
 * Structured lines for a certificate:
 * name (caller) + Kontrollitud + Allikas + verified date + Kehtib kuni.
 */
export function buildCertificateVerificationView(
  fields: Pick<
    CertificateVerificationFields,
    "verification_status" | "verified_at" | "verification_source" | "certificate_valid_until"
  > & { certificate_issuer?: string | null },
  labels: CertificateVerificationViewLabels,
  locale: string,
  asOf: Date = new Date(),
): CertificateVerificationView {
  const status = resolveCertificateEffectiveStatus(fields, asOf);
  const stored = parseCertificateVerificationStatus(fields.verification_status);
  const showVerifiedFacts = status === "verified" || (status === "expired" && stored === "verified");

  const sourceRaw = showVerifiedFacts
    ? (fields.verification_source ?? "").trim() || (fields.certificate_issuer ?? "").trim()
    : "";
  const until = formatIsoDateDisplay(fields.certificate_valid_until, locale);
  const verifiedAt = formatIsoDateDisplay(fields.verified_at, locale);

  return {
    status,
    statusLabel: certificateStatusLabel(status, labels),
    sourceLine: sourceRaw ? labels.source(sourceRaw) : null,
    verifiedOnLine: showVerifiedFacts && verifiedAt ? labels.verifiedOn(verifiedAt) : null,
    validUntilLine: until && (showVerifiedFacts || status === "expired") ? labels.validUntil(until) : null,
  };
}

/** Joined meta for compact contexts. Prefer {@link buildCertificateVerificationView} for layout. */
export function formatCertificateVerifiedMeta(
  fields: Pick<
    CertificateVerificationFields,
    | "certificate_valid_until"
    | "verified_by"
    | "verification_status"
    | "verified_at"
    | "verification_source"
  > & { certificate_issuer?: string | null },
  labels: CertificateVerificationViewLabels,
  locale: string,
  asOf: Date = new Date(),
): string | null {
  const view = buildCertificateVerificationView(fields, labels, locale, asOf);
  const bits = [view.sourceLine, view.verifiedOnLine, view.validUntilLine].filter(Boolean) as string[];
  if (
    view.status === "expired" &&
    labels.previouslyVerified &&
    parseCertificateVerificationStatus(fields.verification_status) === "verified"
  ) {
    bits.unshift(labels.previouslyVerified);
  }
  return bits.length ? bits.join(" · ") : null;
}

export function formatCertificateExpiryWarning(
  validUntil: string | null | undefined,
  labels: { expiresInDays: (days: number) => string; expiresToday: string },
  asOf: Date = new Date()
): string | null {
  if (!isCertificateExpiringSoon(validUntil, asOf)) return null;
  const days = daysUntilCertificateExpiry(validUntil, asOf);
  if (days === null) return null;
  if (days === 0) return labels.expiresToday;
  return labels.expiresInDays(days);
}

export function defaultSubmittedVerification(): CertificateVerificationFields {
  return {
    verification_status: "submitted",
    verified_at: null,
    verification_source: null,
    verified_by: null,
    certificate_valid_until: null,
  };
}
