import { errorMessageFromUnknown } from "@/lib/utils";

/** Maps Supabase / RLS failures to onboarding strings; appends DB fix hints when useful. */
export function formatEmployerProfileSaveError(err: unknown, t: (key: string) => string): string {
  const raw = errorMessageFromUnknown(err, t("unknownError"));
  const lower = raw.toLowerCase();
  if (
    lower.includes("row level security") ||
    lower.includes("row-level security") ||
    lower.includes("new row violates") ||
    lower.includes("permission denied")
  ) {
    return t("rlsError");
  }
  if (
    lower.includes("logo_url") ||
    (lower.includes("employer_profiles") && (lower.includes("could not find") || lower.includes("schema cache")))
  ) {
    return `${raw}\n\n${t("employerProfileLogoColumnFixHint")}`;
  }
  return raw;
}
