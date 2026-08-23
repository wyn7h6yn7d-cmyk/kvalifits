const STORAGE_PUBLIC_AVATARS = /\/storage\/v1\/object\/public\/avatars\//;

/** Resolve carousel_logo_path (storage key or legacy public URL) to a public URL. */
export function resolveCarouselLogoPublicUrl(
  path: string | null | undefined,
  supabasePublicOrigin?: string | null,
): string | null {
  const raw = (path ?? "").toString().trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

  const origin = (supabasePublicOrigin ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .toString()
    .replace(/\/$/, "");
  if (!origin) return null;

  const key = raw.replace(/^\/+/, "");
  return `${origin}/storage/v1/object/public/avatars/${key}`;
}

/** Employer original logos must live under employer-logo in avatars storage. */
export function isEmployerOriginalLogoStoragePath(path: string | null | undefined): boolean {
  const raw = (path ?? "").toString().trim();
  if (!raw) return false;
  const key = raw.replace(STORAGE_PUBLIC_AVATARS, "").replace(/^\/+/, "");
  const parts = key.split("/").filter(Boolean);
  return parts.length >= 2 && parts[1] === "employer-logo";
}

/** Admin carousel assets live under carousel-logo in the employer owner folder. */
export function isCarouselLogoStoragePath(path: string | null | undefined): boolean {
  const raw = (path ?? "").toString().trim();
  if (!raw) return false;
  const key = raw.replace(STORAGE_PUBLIC_AVATARS, "").replace(/^\/+/, "");
  const parts = key.split("/").filter(Boolean);
  return parts.length >= 2 && parts[1] === "carousel-logo";
}

export function buildCarouselLogoStoragePath(ownerUserId: string, ext: string): string {
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  return `${ownerUserId}/carousel-logo/approved.${safeExt}`;
}
