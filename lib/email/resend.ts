/* eslint-disable @typescript-eslint/no-explicit-any */
type SendEmailArgs = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

export async function sendEmailViaResend(args: SendEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing required environment variable: RESEND_API_KEY.");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: args.from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
    }),
  });

  if (!res.ok) {
    let msg = `Resend API error (${res.status})`;
    try {
      const data = (await res.json()) as any;
      msg = data?.message ? `Resend API error: ${data.message}` : msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  return (await res.json()) as unknown;
}

