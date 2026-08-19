import { reportException, reportMessage } from "@/lib/monitoring/report";

type SendEmailArgs = {
  from: string;
  to: string;
  subject: string;
  html: string;
  /** Stable key so retries do not create a second Resend message. */
  idempotencyKey?: string;
};

export type SendEmailResult = { ok: true } | { ok: false; reason: "missing_config" | "provider_error" };

export async function sendEmailViaResend(args: SendEmailArgs): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.VERCEL_ENV === "production") {
      reportMessage("email_missing_config", { area: "email", code: "missing_config" });
    }
    return { ok: false, reason: "missing_config" };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (args.idempotencyKey) {
    headers["Idempotency-Key"] = args.idempotencyKey;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers,
      body: JSON.stringify({
        from: args.from,
        to: [args.to],
        subject: args.subject,
        html: args.html,
      }),
    });

    if (!res.ok) {
      try {
        await res.json();
      } catch {
        // ignore provider body — never surface it
      }
      reportMessage("email_provider_error", {
        area: "email",
        code: "provider_error",
        extras: { status: res.status },
      });
      return { ok: false, reason: "provider_error" };
    }

    return { ok: true };
  } catch (err) {
    reportException(err, { area: "email", code: "provider_error" });
    return { ok: false, reason: "provider_error" };
  }
}
