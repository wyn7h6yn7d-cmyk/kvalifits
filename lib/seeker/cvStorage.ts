/**
 * Private candidate CV storage (Supabase Storage bucket `resumes`).
 * Persist object paths in `seeker_profiles.cv_url` — never public URLs.
 */

export const RESUMES_BUCKET = "resumes";

/** Default signed URL lifetime (seconds). */
export const CV_SIGNED_URL_TTL_SEC = 60 * 10; // 10 minutes

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const LEGACY_PUBLIC_AVATARS_CV =
  /\/storage\/v1\/object\/public\/avatars\/(.+\/cv\/.+)$/i;

export type CvStorageRef = {
  bucket: typeof RESUMES_BUCKET;
  /** Object path inside the bucket, e.g. `{userId}/cv/{file}.pdf`. */
  path: string;
  ownerUserId: string;
  /** True when value was a legacy public avatars URL. */
  legacyPublicAvatars: boolean;
};

export function buildCvObjectPath(userId: string, originalName: string): string {
  const safeBase = originalName
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${userId}/cv/${Date.now()}-${safeBase || "cv"}.pdf`;
}

function normalizeCvPath(rawPath: string): string | null {
  let path = rawPath.replace(/^\/+/, "");
  if (path.startsWith(`${RESUMES_BUCKET}/`)) {
    path = path.slice(RESUMES_BUCKET.length + 1);
  }
  path = path.split("?")[0] ?? "";
  const parts = path.split("/").filter(Boolean);
  if (parts.length < 3) return null;
  if (parts[1] !== "cv") return null;
  if (path.includes("..")) return null;
  const ownerUserId = parts[0] ?? "";
  if (!UUID_RE.test(ownerUserId)) return null;
  return path;
}

/**
 * Normalize DB value to a private-bucket object path.
 * Accepts: `userId/cv/file.pdf`, or legacy public avatars URL under `.../cv/`.
 */
export function parseCvStorageRef(value: string | null | undefined): CvStorageRef | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;

  let path = raw;
  let legacyPublicAvatars = false;

  if (/^https?:\/\//i.test(raw)) {
    const m = raw.match(LEGACY_PUBLIC_AVATARS_CV);
    if (!m?.[1]) return null;
    path = decodeURIComponent(m[1]);
    legacyPublicAvatars = true;
  }

  const normalized = normalizeCvPath(path);
  if (!normalized) return null;

  return {
    bucket: RESUMES_BUCKET,
    path: normalized,
    ownerUserId: normalized.split("/")[0]!,
    legacyPublicAvatars,
  };
}

export function hasCvStorageRef(value: string | null | undefined): boolean {
  return Boolean(parseCvStorageRef(value));
}

export function firstCvStorageRef(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    const persisted = persistCvStorageRef(value);
    if (persisted) return persisted;
  }
  return null;
}

export function isPublicStorageUrl(value: string | null | undefined): boolean {
  const v = (value ?? "").trim();
  return /\/storage\/v1\/object\/public\//i.test(v);
}

/**
 * Value to persist in `seeker_profiles.cv_url`.
 * Always an object path when valid; drops other public Storage URLs.
 */
export function persistCvStorageRef(value: string | null | undefined): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const ref = parseCvStorageRef(raw);
  if (ref) return ref.path;
  if (isPublicStorageUrl(raw)) return null;
  return null;
}
