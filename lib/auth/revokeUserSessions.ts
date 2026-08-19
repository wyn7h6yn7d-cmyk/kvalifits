import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Drop the current browser session after a blocked login or callback.
 * Prefer global so other devices sharing this refresh token are also cleared.
 */
export async function signOutAuthSession(supabase: SupabaseClient): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: "global" });
  } catch {
    await supabase.auth.signOut({ scope: "local" });
  }
}

/**
 * Invalidate refresh tokens for a user after an admin block.
 * Access tokens may remain valid until expiry; API/page gates and the write
 * trigger still reject is_blocked accounts.
 */
export async function revokeUserSessions(userId: string): Promise<void> {
  const id = userId.trim();
  if (!id) return;
  const admin = createSupabaseAdminClient();
  if (!admin) return;
  try {
    await admin.auth.admin.signOut(id, "global");
  } catch {
    // Block already persisted; session revoke is best-effort.
  }
}
