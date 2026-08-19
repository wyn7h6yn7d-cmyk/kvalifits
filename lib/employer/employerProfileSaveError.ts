import { errorMessageFromUnknown } from "@/lib/utils";
import { isEmployerOwnerUniqueViolation } from "@/lib/employer/employerOwnerUniqueness";

/** Maps Supabase / RLS failures to onboarding strings; appends DB fix hints when useful. */
export function formatEmployerProfileSaveError(err: unknown, t: (key: string) => string): string {
  const code =
    typeof err === "object" && err && "code" in err ? String((err as { code?: unknown }).code ?? "") : "";
  if (isEmployerOwnerUniqueViolation({ code, message: errorMessageFromUnknown(err, "") })) {
    return t("ownerUniqueError");
  }
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
  if (
    lower.includes("company_verified") ||
    lower.includes("verification_status") ||
    lower.includes("verification_source") ||
    (lower.includes("verified_at") && lower.includes("employer"))
  ) {
    return `${raw}\n\n${t("companyVerificationFixHint")}`;
  }
  return raw;
}
