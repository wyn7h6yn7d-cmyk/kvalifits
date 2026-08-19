export type UploadRateLimitKind = "cv" | "certificate" | "avatar" | "employer_logo";

export async function consumeUploadRateLimit(kind: UploadRateLimitKind): Promise<void> {
  const res = await fetch("/api/uploads/consume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
    cache: "no-store",
  });
  if (res.status === 429) {
    throw new Error("upload_rate_limited");
  }
  if (!res.ok) {
    throw new Error("upload_rate_check_failed");
  }
}
