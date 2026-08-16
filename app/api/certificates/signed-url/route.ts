import { NextResponse } from "next/server";

import {
  CERTIFICATE_SIGNED_URL_TTL_SEC,
  CERTIFICATES_BUCKET,
  parseCertificateStorageRef,
} from "@/lib/seeker/certificateStorage";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type AccessOk = { ok: true } | { ok: false; status: number; error: string };

async function authorizeCertificateAccess(args: {
  viewerId: string;
  ownerUserId: string;
  role: string | null;
}): Promise<AccessOk> {
  const { viewerId, ownerUserId, role } = args;

  if (viewerId === ownerUserId) return { ok: true };
  if (role === "admin") return { ok: true };

  if (role !== "employer") {
    return { ok: false, status: 403, error: "forbidden" };
  }

  const db = createSupabaseAdminClient() ?? (await createSupabaseServerClient());

  const { data: apps, error: appsErr } = await db
    .from("job_applications")
    .select("job_post_id")
    .eq("seeker_user_id", ownerUserId)
    .eq("consent_to_share", true)
    .neq("status", "withdrawn")
    .limit(50);

  if (appsErr) {
    return { ok: false, status: 500, error: "access_check_failed" };
  }
  const jobIds = (apps ?? []).map((a) => a.job_post_id as string).filter(Boolean);
  if (!jobIds.length) {
    return { ok: false, status: 403, error: "forbidden" };
  }

  const { data: posts, error: postsErr } = await db
    .from("job_posts")
    .select("id, employer_profile_id")
    .in("id", jobIds);

  if (postsErr) {
    return { ok: false, status: 500, error: "access_check_failed" };
  }
  const employerProfileIds = [
    ...new Set((posts ?? []).map((p) => p.employer_profile_id as string).filter(Boolean)),
  ];
  if (!employerProfileIds.length) {
    return { ok: false, status: 403, error: "forbidden" };
  }

  const { data: owned, error: epErr } = await db
    .from("employer_profiles")
    .select("id")
    .in("id", employerProfileIds)
    .eq("owner_user_id", viewerId)
    .limit(1);

  if (epErr) {
    return { ok: false, status: 500, error: "access_check_failed" };
  }
  if (!owned?.length) {
    return { ok: false, status: 403, error: "forbidden" };
  }
  return { ok: true };
}

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
    // Legacy files may still sit in public avatars; do not mint a stable public link.
    // Client should re-upload into the private bucket. Refuse permanent public exposure.
    return NextResponse.json(
      { error: "legacy_public_file", message: "Re-upload certificate into private storage." },
      { status: 409 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const access = await authorizeCertificateAccess({
    viewerId: user.id,
    ownerUserId: ref.ownerUserId,
    role: (profile?.role as string | null) ?? null,
  });
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const ttlRaw = Number(url.searchParams.get("ttl") ?? CERTIFICATE_SIGNED_URL_TTL_SEC);
  const ttl = Number.isFinite(ttlRaw)
    ? Math.min(Math.max(Math.floor(ttlRaw), 30), 60 * 60)
    : CERTIFICATE_SIGNED_URL_TTL_SEC;

  // Prefer user client so Storage RLS still applies; fall back to service role after authz.
  let signedUrl: string | null = null;
  let signError: string | null = null;

  const userSign = await supabase.storage
    .from(CERTIFICATES_BUCKET)
    .createSignedUrl(ref.path, ttl);

  if (userSign.data?.signedUrl) {
    signedUrl = userSign.data.signedUrl;
  } else {
    signError = userSign.error?.message ?? null;
    const admin = createSupabaseAdminClient();
    if (admin) {
      const adminSign = await admin.storage
        .from(CERTIFICATES_BUCKET)
        .createSignedUrl(ref.path, ttl);
      if (adminSign.data?.signedUrl) {
        signedUrl = adminSign.data.signedUrl;
        signError = null;
      } else {
        signError = adminSign.error?.message ?? signError;
      }
    }
  }

  if (!signedUrl) {
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
