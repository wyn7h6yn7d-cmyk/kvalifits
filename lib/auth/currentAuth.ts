import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const APP_ROLES = ["seeker", "employer", "admin"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export type CurrentAuth = {
  authenticated: boolean;
  userId: string | null;
  role: AppRole | null;
};

export function isAppRole(value: unknown): value is AppRole {
  return value === "seeker" || value === "employer" || value === "admin";
}

/** One Auth getUser() per server request. */
export const getAuthUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Session + profiles.role for shared UI. Not an authorization check. */
export const getCurrentAuth = cache(async (): Promise<CurrentAuth> => {
  const user = await getAuthUser();
  if (!user) {
    return { authenticated: false, userId: null, role: null };
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  return {
    authenticated: true,
    userId: user.id,
    role: isAppRole(profile?.role) ? profile.role : null,
  };
});
