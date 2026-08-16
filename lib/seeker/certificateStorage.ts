/**
 * Private certificate file storage (Supabase Storage bucket `certificates`).
 * Persist object paths in `seeker_certificates.certificate_image_url` — never public URLs.
 */

export const CERTIFICATES_BUCKET = "certificates";

/** Default signed URL lifetime (seconds). */
export const CERTIFICATE_SIGNED_URL_TTL_SEC = 60 * 10; // 10 minutes

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const LEGACY_PUBLIC_AVATARS =
  /\/storage\/v1\/object\/public\/avatars\/(.+)$/i;

export type CertificateStorageRef = {
  bucket: typeof CERTIFICATES_BUCKET;
  /** Object path inside the bucket, e.g. `{userId}/{file}`. */
  path: string;
  ownerUserId: string;
  /** True when value was a legacy public avatars URL (needs migration). */
  legacyPublicAvatars: boolean;
};

export function buildCertificateObjectPath(userId: string, idx: number, ext: string): string {
  const safeExt = (ext || "bin").toLowerCase().replace(/[^a-z0-9]+/g, "") || "bin";
  return `${userId}/${idx}-${Date.now()}.${safeExt}`;
}

/**
 * Normalize DB value to a private-bucket object path.
 * Accepts: path `userId/...`, or legacy public avatars URL under `.../certificates/`.
 */
export function parseCertificateStorageRef(
  value: string | null | undefined
): CertificateStorageRef | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;

  let path = raw;
  let legacyPublicAvatars = false;

  if (/^https?:\/\//i.test(raw)) {
    const m = raw.match(LEGACY_PUBLIC_AVATARS);
    if (!m?.[1]) return null;
    path = decodeURIComponent(m[1].split("?")[0] ?? "");
    legacyPublicAvatars = true;
    // Only treat avatar-bucket certificate uploads as migrateable refs.
    if (!path.includes("/certificates/")) return null;
  }

  path = path.replace(/^\/+/, "");
  if (path.startsWith(`${CERTIFICATES_BUCKET}/`)) {
    path = path.slice(CERTIFICATES_BUCKET.length + 1);
  }

  const ownerUserId = path.split("/")[0] ?? "";
  if (!UUID_RE.test(ownerUserId) || path.includes("..")) return null;

  return {
    bucket: CERTIFICATES_BUCKET,
    path,
    ownerUserId,
    legacyPublicAvatars,
  };
}

export function hasCertificateFileRef(value: string | null | undefined): boolean {
  const raw = (value ?? "").trim();
  if (!raw) return false;
  return Boolean(parseCertificateStorageRef(raw)) || !isPublicStorageUrl(raw);
}

/** True if value looks like a permanent public Storage URL (must not be stored for new uploads). */
export function isPublicStorageUrl(value: string | null | undefined): boolean {
  const v = (value ?? "").trim();
  return /\/storage\/v1\/object\/public\//i.test(v);
}

/**
 * Value to persist in `certificate_image_url`.
 * Prefers private object path; keeps legacy public cert URLs until re-upload;
 * drops other public Storage URLs.
 */
export function persistCertificateImageRef(value: string | null | undefined): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const ref = parseCertificateStorageRef(raw);
  if (ref) {
    if (ref.legacyPublicAvatars) return raw;
    return ref.path;
  }
  if (isPublicStorageUrl(raw)) return null;
  return raw;
}
