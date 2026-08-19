import { NextResponse } from "next/server";

import {
  authGateJson,
  requireAuthenticatedUser,
} from "@/lib/auth/requireAuthenticatedUser";
import {
  clientIpFromHeaders,
  consumeApiRateLimit,
  rateLimitResponse,
  type ApiRateLimitAction,
} from "@/lib/auth/apiRateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_ACTIONS: Record<string, ApiRateLimitAction> = {
  cv: "storage_cv",
  certificate: "storage_certificate",
  avatar: "storage_avatar",
  employer_logo: "storage_avatar",
};

type Body = { kind?: string };

/** Pre-upload rate limit gate for authenticated storage writes. */
export async function POST(req: Request) {
  const gate = await requireAuthenticatedUser();
  if (!gate.ok) return authGateJson(gate, { unauthenticatedError: "not_authed" });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const action = UPLOAD_ACTIONS[(body.kind ?? "").trim()];
  if (!action) {
    return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  }

  const ip = clientIpFromHeaders(req.headers);
  const rate = await consumeApiRateLimit({ action, ip, userId: gate.user.id });
  if (!rate.ok) return rateLimitResponse(rate.retryAfterSeconds);

  return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
}
