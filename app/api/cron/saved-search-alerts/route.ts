import { NextResponse } from "next/server";

import { runSavedSearchAlertDelivery } from "@/lib/jobs/runSavedSearchAlertDelivery";
import { cronBearerAuthorized } from "@/lib/jobs/savedSearchAlertDelivery";
import { reportException } from "@/lib/monitoring/report";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!cronBearerAuthorized(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "missing_service_role_key" }, { status: 500 });
  }

  try {
    const summary = await runSavedSearchAlertDelivery({ admin });
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    reportException(err, { area: "api", code: "saved_search_alert_cron" });
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
