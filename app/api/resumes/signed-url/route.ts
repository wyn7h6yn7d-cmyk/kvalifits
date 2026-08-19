import { NextResponse } from "next/server";

import { authorizeApplicantDocumentAccess } from "@/lib/auth/authorizeApplicantDocument";
import { authGateJson, requireAuthenticatedUser } from "@/lib/auth/requireAuthenticatedUser";
import { CV_SIGNED_URL_TTL_SEC, RESUMES_BUCKET, parseCvStorageRef } from "@/lib/seeker/cvStorage";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { reportMessage } from "@/lib/monitoring/report";

export const runtime = "nodejs";

/**
 * Short-lived signed URL for a private CV object.
 * Query: `path` = object path stored in seeker_profiles.cv_url.
 * Never returns a permanent public URL.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawPath = (url.searchParams.get("path") ?? url.searchParams.get("ref") ?? "").trim();
  if (!rawPath) {
    return NextResponse.json({ error: "path_required" }, { status: 400 });
  }

  const ref = parseCvStorageRef(rawPath);
  if (!ref) {
    return NextResponse.json({ error: "invalid_path" }, { status: 400 });
  }

  const gate = await requireAuthenticatedUser();
  if (!gate.ok) return authGateJson(gate, { unauthenticatedError: "unauthorized" });
  const { supabase } = gate;

  const access = await authorizeApplicantDocumentAccess({
    viewerId: gate.user.id,
    ownerUserId: ref.ownerUserId,
    role: gate.role,
  });
  if (!access.ok) {
    if (access.status >= 500) {
      reportMessage("document_access_check_failed", {
        area: "storage",
        code: access.error,
      });
    }
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const ttlRaw = Number(url.searchParams.get("ttl") ?? CV_SIGNED_URL_TTL_SEC);
  const ttl = Number.isFinite(ttlRaw)
    ? Math.min(Math.max(Math.floor(ttlRaw), 30), 60 * 60)
    : CV_SIGNED_URL_TTL_SEC;

  let signedUrl: string | null = null;
  let bucket = RESUMES_BUCKET;

  const userSign = await supabase.storage.from(RESUMES_BUCKET).createSignedUrl(ref.path, ttl);
  if (userSign.data?.signedUrl) {
    signedUrl = userSign.data.signedUrl;
  } else {
    const admin = createSupabaseAdminClient();
    if (admin) {
      const adminSign = await admin.storage.from(RESUMES_BUCKET).createSignedUrl(ref.path, ttl);
      if (adminSign.data?.signedUrl) {
        signedUrl = adminSign.data.signedUrl;
      } else {
        const legacySign = await admin.storage.from("avatars").createSignedUrl(ref.path, ttl);
        if (legacySign.data?.signedUrl) {
          signedUrl = legacySign.data.signedUrl;
          bucket = "avatars";
        }
      }
    }
  }

  if (!signedUrl) {
    reportMessage("cv_sign_failed", { area: "storage", code: "sign_failed" });
    return NextResponse.json(
      { error: "sign_failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    signedUrl,
    expiresIn: ttl,
    path: ref.path,
    bucket,
  });
}
