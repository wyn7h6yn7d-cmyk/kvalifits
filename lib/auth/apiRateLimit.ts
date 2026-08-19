import { createHash } from "crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { clientIpFromHeaders, type RateLimitResult } from "./rateLimit";

export type ApiRateLimitAction =
  | "job_application"
  | "job_report"
  | "saved_search_create";

const API_RATE_LIMITS: Record<ApiRateLimitAction, { windowSeconds: number; maxHits: number }> = {
  job_application: { windowSeconds: 60 * 60, maxHits: 40 },
  job_report: { windowSeconds: 60 * 60, maxHits: 12 },
  saved_search_create: { windowSeconds: 60 * 60, maxHits: 20 },
};

function hashPart(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

export function buildApiRateLimitBucketKey(opts: {
  action: ApiRateLimitAction;
  ip: string;
  userId?: string | null;
}): string {
  const parts = ["api", opts.action, hashPart(opts.ip)];
  if (opts.userId) parts.push(hashPart(opts.userId));
  return parts.join(":");
}

/** Reuses auth_rate_limit_hit RPC with api-prefixed bucket keys. */
export async function consumeApiRateLimit(opts: {
  action: ApiRateLimitAction;
  ip: string;
  userId?: string | null;
}): Promise<RateLimitResult> {
  const limits = API_RATE_LIMITS[opts.action];
  const bucketKey = buildApiRateLimitBucketKey(opts);
  const admin = createSupabaseAdminClient();

  if (!admin) {
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

export function rateLimitResponse(retryAfterSeconds: number) {
  return new Response(JSON.stringify({ error: "rate_limited" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(Math.max(1, Math.ceil(retryAfterSeconds))),
    },
  });
}

export { clientIpFromHeaders };
