import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * Ends the current session cookies. Uses global scope so refresh tokens are revoked
 * for this user across devices when supported by the project.
 */
export async function POST(request: Request, { params }: Props) {
  const { locale } = await params;
  const url = new URL(request.url);
  const supabase = await createSupabaseServerClient();
  try {
    await supabase.auth.signOut({ scope: "global" });
  } catch {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Always redirect safely.
    }
  }
  return NextResponse.redirect(new URL(`/${locale}`, url.origin), { status: 303 });
}
