import { NextResponse } from "next/server";

import {
  isAdminModerationAction,
  type AdminModerationAction,
  type ModerationQueue,
} from "@/lib/admin/moderationTypes";
import { runModerationAction } from "@/lib/admin/runModerationAction";
import { authGateJson, requireAuthenticatedUser } from "@/lib/auth/requireAuthenticatedUser";
import { errorMessageFromUnknown } from "@/lib/utils";

export const runtime = "nodejs";

const QUEUES: readonly ModerationQueue[] = [
  "reports",
  "certificates",
  "companies",
  "blocked_users",
];

type Body = {
  queue?: string;
  action?: string;
  targetId?: string;
};

function isQueue(v: unknown): v is ModerationQueue {
  return typeof v === "string" && (QUEUES as readonly string[]).includes(v);
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const queue = body.queue;
  const action = body.action;
  const targetId = (body.targetId ?? "").toString().trim();

  if (!isQueue(queue) || !isAdminModerationAction(action) || !targetId) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const gate = await requireAuthenticatedUser();
  if (!gate.ok) return authGateJson(gate);
  if (gate.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    await runModerationAction({
      supabase: gate.supabase,
      adminUserId: gate.user.id,
      queue,
      action: action as AdminModerationAction,
      targetId,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = errorMessageFromUnknown(err, "moderation_failed");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
