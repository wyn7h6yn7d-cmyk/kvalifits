/**
 * Seeker profile photo must come from our Supabase Storage `avatars` bucket (file upload flow),
 * not an arbitrary URL (e.g. OAuth provider avatar).
 */
const AVATAR_PUBLIC_OBJECT_PATH = /\/storage\/v1\/object\/public\/avatars\//;

export function isSeekerAvatarFromStorageUpload(avatarUrl: string | null | undefined): boolean {
  const u = (avatarUrl ?? "").trim();
  if (!u) return false;
  return AVATAR_PUBLIC_OBJECT_PATH.test(u);
}
