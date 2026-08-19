const SIMPLE_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const RESEND_VERIFICATION_ACTION = "resend_verification" as const;
export const RESEND_VERIFICATION_MAX_HITS = 5;
export const RESEND_VERIFICATION_WINDOW_SECONDS = 60 * 60;

export type ResendVerificationPublicBody = { ok: true } | { error: string; retryAfterSeconds?: number };

export type ResendVerificationPublicResult = {
  status: number;
  body: ResendVerificationPublicBody;
  headers?: Record<string, string>;
};

export type ResendRateLimitResult =
  | { ok: true; hitCount: number }
  | { ok: false; retryAfterSeconds: number; hitCount: number; error?: string };

export function normalizeResendVerificationEmail(raw: unknown): string | null {
  const email = (raw ?? "").toString().trim().toLowerCase();
  if (!email || !SIMPLE_EMAIL_RE.test(email)) return null;
  return email;
}

export function resendVerificationRedirectLocale(raw: unknown): string {
  const locale = ((raw ?? "et").toString() || "et").slice(0, 5);
  if (locale === "en" || locale === "ru" || locale === "et") return locale;
  return "et";
}

/** IP spray bucket, then IP+email account bucket. */
export function resendVerificationLimitOpts(ip: string, email: string) {
  return [
    { action: RESEND_VERIFICATION_ACTION, ip },
    { action: RESEND_VERIFICATION_ACTION, ip, email },
  ] as const;
}

export function invalidEmailResendResponse(): ResendVerificationPublicResult {
  return { status: 400, body: { error: "missing_email" } };
}

export function rateLimitedResendResponse(retryAfterSeconds: number): ResendVerificationPublicResult {
  const retry = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0 ? retryAfterSeconds : 60;
  return {
    status: 429,
    body: { error: "rate_limited", retryAfterSeconds: retry },
    headers: { "Retry-After": String(retry) },
  };
}

export function genericResendVerificationOk(): ResendVerificationPublicResult {
  return { status: 200, body: { ok: true } };
}

/**
 * Public outcome after a provider call. Unknown users, confirmed users, and
 * send failures must look the same. Provider rate limits stay 429.
 */
export function publicResultAfterProviderResend(
  error: { message?: string | null } | null,
): ResendVerificationPublicResult {
  const lower = (error?.message ?? "").toLowerCase();
  if (lower.includes("rate") || lower.includes("too many") || lower.includes("over_email_send_rate_limit")) {
    return rateLimitedResendResponse(60);
  }
  return genericResendVerificationOk();
}

export function publicResultAfterRateLimit(limit: ResendRateLimitResult): ResendVerificationPublicResult | null {
  if (limit.ok) return null;
  if (limit.error === "missing_rate_limit_table") {
    return {
      status: 429,
      body: { error: "missing_rate_limit_table", retryAfterSeconds: limit.retryAfterSeconds },
    };
  }
  return rateLimitedResendResponse(limit.retryAfterSeconds);
}

export function resendHitAllowed(
  hitCount: number,
  maxHits = RESEND_VERIFICATION_MAX_HITS,
): boolean {
  return hitCount <= maxHits;
}
