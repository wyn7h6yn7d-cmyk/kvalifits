import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  emptyProfileSecurity,
  profileLookupFailed,
  profileSecurityFromRow,
  type ProfileSecurity,
} from "@/lib/auth/accountBlocked";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loadProfileSecurity(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileSecurity> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, is_blocked")
    .eq("id", userId)
    .maybeSingle();

  if (error) return profileLookupFailed();
  if (!data) return emptyProfileSecurity();
  return profileSecurityFromRow(data);
}

/** One profiles.role + is_blocked read per user id per request. */
export const getProfileSecurity = cache(async (userId: string): Promise<ProfileSecurity> => {
  const supabase = await createSupabaseServerClient();
  return loadProfileSecurity(supabase, userId);
});
