import { NextResponse } from "next/server";

import { exportAccountData } from "@/lib/account/exportAccountData";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Download a JSON copy of the authenticated user's personal data.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  try {
    const payload = await exportAccountData({ supabase, user });
    const body = JSON.stringify(payload, null, 2);
    const filename = `kvalifits-andmed-${user.id.slice(0, 8)}.json`;
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "export_failed";
    return NextResponse.json({ error: "export_failed", message }, { status: 500 });
  }
}
