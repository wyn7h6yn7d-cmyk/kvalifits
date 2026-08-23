const STORAGE_PUBLIC_AVATARS = /\/storage\/v1\/object\/public\/avatars\/(.+)$/i;

/** Extract avatars bucket object key from a public logo URL. */
export function extractAvatarsStoragePathFromLogoUrl(logoUrl: string | null | undefined): string | null {
  const raw = (logoUrl ?? "").toString().trim();
  if (!raw) return null;
  const match = raw.match(STORAGE_PUBLIC_AVATARS);
  if (match?.[1]) return decodeURIComponent(match[1].split("?")[0] ?? "").replace(/^\/+/, "");
  return null;
}

export function buildProcessedCarouselLogoStoragePath(ownerUserId: string): string {
  return `${ownerUserId}/carousel-logo/processed.png`;
}
