import { createHash } from "crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AuthRateLimitAction = "login" | "register" | "password_reset" | "resend_verification";

/** Conservative defaults; Supabase Auth still applies its own email send limits. */
export const AUTH_RATE_LIMITS: Record<
  AuthRateLimitAction,
  { windowSeconds: number; maxHits: number }
> = {
  login: { windowSeconds: 15 * 60, maxHits: 20 },
  register: { windowSeconds: 60 * 60, maxHits: 8 },
  password_reset: { windowSeconds: 60 * 60, maxHits: 5 },
  resend_verification: { windowSeconds: 60 * 60, maxHits: 5 },
};

export type RateLimitResult =
  | { ok: true; hitCount: number }
  | { ok: false; retryAfterSeconds: number; hitCount: number; error?: string };

function hashPart(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

export function clientIpFromHeaders(headers: Headers): string {
  const xf = headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export function buildRateLimitBucketKey(opts: {
  action: AuthRateLimitAction;
  ip: string;
  email?: string | null;
}): string {
  const emailNorm = (opts.email ?? "").trim().toLowerCase();
  const parts = [`auth`, opts.action, hashPart(opts.ip)];
  if (emailNorm) parts.push(hashPart(emailNorm));
  return parts.join(":");
}

/**
 * Fixed-window rate limit via Supabase RPC (service role).
 * Missing infra (no service role / table / RPC) fails open so auth stays usable.
 * Set AUTH_RATE_LIMIT_FAIL_OPEN=1 to also fail open on unexpected RPC errors.
 */
export async function consumeAuthRateLimit(opts: {
  action: AuthRateLimitAction;
  ip: string;
  email?: string | null;
}): Promise<RateLimitResult> {
  const limits = AUTH_RATE_LIMITS[opts.action];
  const bucketKey = buildRateLimitBucketKey(opts);
  const admin = createSupabaseAdminClient();

  if (!admin) {
    // Without service role we cannot enforce buckets — do not lock users out.
    return { ok: true, hitCount: 0 };
  }

  const { data, error } = await admin.rpc("auth_rate_limit_hit", {
    p_bucket_key: bucketKey,
    p_window_seconds: limits.windowSeconds,
    p_max_hits: limits.maxHits,
  });

  if (error) {
    const msg = (error.message ?? "").toLowerCase();
    const missingInfra =
      msg.includes("auth_rate_limit") ||
      msg.includes("schema cache") ||
      msg.includes("does not exist") ||
      msg.includes("could not find");
    if (missingInfra || process.env.AUTH_RATE_LIMIT_FAIL_OPEN === "1") {
      // Table/RPC not deployed yet — allow auth; run fix-auth-rate-limit.sql in SQL Editor.
      return { ok: true, hitCount: 0 };
    }
    return { ok: false, retryAfterSeconds: 60, hitCount: 0, error: "rate_limit_failed" };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const allowed = Boolean((row as { allowed?: boolean } | null)?.allowed);
  const retryAfterSeconds = Number((row as { retry_after_seconds?: number } | null)?.retry_after_seconds ?? 0);
  const hitCount = Number((row as { hit_count?: number } | null)?.hit_count ?? 0);

  if (!allowed) {
    return {
      ok: false,
      retryAfterSeconds: Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0 ? retryAfterSeconds : 60,
      hitCount,
    };
  }
  return { ok: true, hitCount };
}
