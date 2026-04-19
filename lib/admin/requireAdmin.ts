/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdmin(locale: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth/login`);

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const metaRole = (user.user_metadata as any)?.role;
  const role = (profileErr ? metaRole : profile?.role) ?? metaRole ?? null;

  if (role !== "admin") redirect(`/${locale}/account`);

  return { supabase, user };
}

