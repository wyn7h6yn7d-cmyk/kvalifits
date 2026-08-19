import { NextResponse } from "next/server";

import { authorizeApplicantDocumentAccess } from "@/lib/auth/authorizeApplicantDocument";
import { authGateJson, requireAuthenticatedUser } from "@/lib/auth/requireAuthenticatedUser";
import {
  CERTIFICATE_SIGNED_URL_TTL_SEC,
  CERTIFICATES_BUCKET,
  parseCertificateStorageRef,
} from "@/lib/seeker/certificateStorage";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { reportMessage } from "@/lib/monitoring/report";

export const runtime = "nodejs";

/**
 * Short-lived signed URL for a private certificate object.
 * Query: `path` = object path stored in certificate_image_url (or legacy public URL).
 * Never returns a permanent public URL.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawPath = (url.searchParams.get("path") ?? url.searchParams.get("ref") ?? "").trim();
  if (!rawPath) {
    return NextResponse.json({ error: "path_required" }, { status: 400 });
  }

  const ref = parseCertificateStorageRef(rawPath);
  if (!ref) {
    return NextResponse.json({ error: "invalid_path" }, { status: 400 });
  }

  if (ref.legacyPublicAvatars) {
    return NextResponse.json(
      { error: "legacy_public_file", message: "Re-upload certificate into private storage." },
      { status: 409 }
    );
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

  const ttlRaw = Number(url.searchParams.get("ttl") ?? CERTIFICATE_SIGNED_URL_TTL_SEC);
  const ttl = Number.isFinite(ttlRaw)
    ? Math.min(Math.max(Math.floor(ttlRaw), 30), 60 * 60)
    : CERTIFICATE_SIGNED_URL_TTL_SEC;

  let signedUrl: string | null = null;
  let signError: string | null = null;

  const userSign = await supabase.storage.from(CERTIFICATES_BUCKET).createSignedUrl(ref.path, ttl);

  if (userSign.data?.signedUrl) {
    signedUrl = userSign.data.signedUrl;
  } else {
    signError = userSign.error?.message ?? null;
    const admin = createSupabaseAdminClient();
    if (admin) {
      const adminSign = await admin.storage.from(CERTIFICATES_BUCKET).createSignedUrl(ref.path, ttl);
      if (adminSign.data?.signedUrl) {
        signedUrl = adminSign.data.signedUrl;
        signError = null;
      } else {
        signError = adminSign.error?.message ?? signError;
      }
    }
  }

  if (!signedUrl) {
    reportMessage("certificate_sign_failed", { area: "storage", code: "sign_failed" });
    return NextResponse.json(
      { error: "sign_failed", message: signError ?? "Unable to create signed URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    signedUrl,
    expiresIn: ttl,
    path: ref.path,
    bucket: CERTIFICATES_BUCKET,
  });
}
