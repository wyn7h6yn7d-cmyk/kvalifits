/**
 * Application submit vs employer-notification outcomes.
 * A confirmed job_applications INSERT is a successful application.
 * Employer email is best-effort and must never fail the candidate response.
 *
 * Outbox follow-up: a durable application_notify_outbox + worker is not in this
 * change. Idempotency-Key + employer_notified_at prevent duplicate Resend sends.
 */

export type ApplicationInsertError = {
  code?: string | null;
  message?: string | null;
};

export type ApplicationInsertRow = {
  id: string;
  created_at: string;
  match_score?: number | null;
  employer_notified_at?: string | null;
};

export type ApplicationSubmitResult =
  | { kind: "created"; id: string; createdAt: string; matchScore: number | null }
  | { kind: "already_applied"; id: string | null }
  | { kind: "insert_failed"; error: string; status: number };

export function resultFromApplicationInsert(args: {
  error: ApplicationInsertError | null;
  row: ApplicationInsertRow | null;
}): ApplicationSubmitResult {
  if (args.error?.code === "23505") {
    return { kind: "already_applied", id: null };
  }
  if (args.error) {
    const msg = (args.error.message ?? "").toLowerCase();
    if (msg.includes("application_answers") || msg.includes("schema cache")) {
      return { kind: "insert_failed", error: "missing_application_answers_column", status: 500 };
    }
    return { kind: "insert_failed", error: "server_error", status: 500 };
  }
  if (!args.row?.id) {
    return { kind: "insert_failed", error: "server_error", status: 500 };
  }
  return {
    kind: "created",
    id: args.row.id,
    createdAt: args.row.created_at,
    matchScore: args.row.match_score ?? null,
  };
}

export function jsonForApplicationSubmit(result: ApplicationSubmitResult): {
  status: number;
  body: Record<string, unknown>;
} {
  if (result.kind === "created") {
    return {
      status: 200,
      body: {
        ok: true,
        id: result.id,
        createdAt: result.createdAt,
        matchScore: result.matchScore,
      },
    };
  }
  if (result.kind === "already_applied") {
    return {
      status: 409,
      body: {
        error: "duplicate_application",
        alreadyApplied: true,
        ...(result.id ? { id: result.id } : {}),
      },
    };
  }
  return { status: result.status, body: { error: result.error } };
}

export function shouldSendEmployerApplicationEmail(notifiedAt: string | null | undefined): boolean {
  return !notifiedAt;
}

export function employerNotifyIdempotencyKey(applicationId: string): string {
  return `kvalifits-app-notify:${applicationId}`;
}

/** Safe log payload — never include provider bodies, API keys, or recipient addresses. */
export function safeEmployerNotifyFailLog(applicationId: string): {
  event: string;
  applicationId: string;
} {
  return { event: "employer_application_notify_failed", applicationId };
}

export type SendEmailResult = { ok: true } | { ok: false; reason: "missing_config" | "provider_error" };

export async function deliverEmployerApplicationEmail(args: {
  applicationId: string;
  notifiedAt: string | null | undefined;
  send: (idempotencyKey: string) => Promise<SendEmailResult>;
  markNotified: (applicationId: string) => Promise<void>;
}): Promise<"sent" | "skipped" | "failed"> {
  if (!shouldSendEmployerApplicationEmail(args.notifiedAt)) {
    return "skipped";
  }
  const result = await args.send(employerNotifyIdempotencyKey(args.applicationId));
  if (!result.ok) {
    return "failed";
  }
  await args.markNotified(args.applicationId);
  return "sent";
}
