/** Logo must be uploaded to Supabase Storage `avatars` bucket (same as seeker assets). */
const STORAGE_PUBLIC_AVATARS = /\/storage\/v1\/object\/public\/avatars\//;

export function isEmployerLogoFromStorageUpload(logoUrl: string | null | undefined): boolean {
  const u = (logoUrl ?? "").trim();
  if (!u) return false;
  return STORAGE_PUBLIC_AVATARS.test(u);
}
