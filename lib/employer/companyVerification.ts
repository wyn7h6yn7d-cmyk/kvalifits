/**
 * Employer company verification lifecycle.
 * Profiles start as `unverified`. Company name / registry code alone never mark verified.
 * No Äriregister integration yet — admins set status manually.
 */

export const EMPLOYER_COMPANY_VERIFICATION_STATUS_VALUES = [
  "unverified",
  "under_review",
  "verified",
] as const;

export type EmployerCompanyVerificationStatus =
  (typeof EMPLOYER_COMPANY_VERIFICATION_STATUS_VALUES)[number];

export type EmployerCompanyVerificationFields = {
  company_verified: boolean;
  verification_status: EmployerCompanyVerificationStatus;
  verification_source: string | null;
  verified_at: string | null;
};

export function isEmployerCompanyVerificationStatus(
  v: unknown
): v is EmployerCompanyVerificationStatus {
  return (
    typeof v === "string" &&
    (EMPLOYER_COMPANY_VERIFICATION_STATUS_VALUES as readonly string[]).includes(v)
  );
}

export function parseEmployerCompanyVerificationStatus(
  v: unknown
): EmployerCompanyVerificationStatus {
  return isEmployerCompanyVerificationStatus(v) ? v : "unverified";
}

/**
 * Public “verified company” signal — requires both the boolean and status.
 * Never trust company_name presence.
 */
export function isEmployerCompanyVerified(fields: {
  company_verified?: boolean | null;
  verification_status?: string | null;
} | null | undefined): boolean {
  if (!fields) return false;
  return (
    fields.company_verified === true &&
    parseEmployerCompanyVerificationStatus(fields.verification_status) === "verified"
  );
}

export function parseEmployerCompanyVerificationFields(
  row:
    | {
        company_verified?: boolean | null;
        verification_status?: string | null;
        verification_source?: string | null;
        verified_at?: string | null;
      }
    | null
    | undefined
): EmployerCompanyVerificationFields {
  const status = parseEmployerCompanyVerificationStatus(row?.verification_status);
  const verified = status === "verified" && row?.company_verified === true;
  return {
    company_verified: verified,
    verification_status: status,
    verification_source: verified
      ? ((row?.verification_source ?? "").toString().trim() || null)
      : null,
    verified_at: verified ? (row?.verified_at ?? null) : null,
  };
}

/** Default for new profiles / missing columns. */
export function defaultUnverifiedCompany(): EmployerCompanyVerificationFields {
  return {
    company_verified: false,
    verification_status: "unverified",
    verification_source: null,
    verified_at: null,
  };
}
