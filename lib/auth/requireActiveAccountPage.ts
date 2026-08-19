import { redirect } from "next/navigation";

import { getCurrentAuth, type CurrentAuth } from "@/lib/auth/currentAuth";

/** Protected pages: unauthenticated → login, blocked → /blocked. */
export async function requireActiveAccountPage(locale: string): Promise<CurrentAuth> {
  const auth = await getCurrentAuth();
  if (!auth.authenticated) redirect(`/${locale}/auth/login`);
  if (auth.isBlocked) redirect(`/${locale}/blocked`);
  return auth;
}
