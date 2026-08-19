/** Playwright harness uses a non-routable Supabase host for deterministic UI tests. */
export function isE2eOfflineSupabase(): boolean {
  if (process.env.E2E_HARNESS !== "1") return false;
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  return url.includes("example.invalid");
}
