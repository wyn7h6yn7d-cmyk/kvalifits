/**
 * One employer_profiles row per owner_user_id.
 * Enforced in Postgres by UNIQUE (owner_user_id). Concurrent placeholder
 * INSERTs must treat 23505 as "already exists", not as a second company.
 */

export const EMPLOYER_OWNER_UNIQUE_SQLSTATE = "23505";

export type EmployerOwnerInsertError = {
  code?: string | null;
  message?: string | null;
};

export type EmployerOwnerInsertResult =
  | { kind: "created" }
  | { kind: "already_exists" }
  | { kind: "failed"; message: string };

export function employerProfilePlaceholderRow(ownerUserId: string, contactEmail: string) {
  return {
    owner_user_id: ownerUserId,
    company_name: "",
    contact_email: contactEmail,
    company_description: "",
    location: "",
  };
}

export function isEmployerOwnerUniqueViolation(error: EmployerOwnerInsertError | null | undefined): boolean {
  if (!error) return false;
  if (error.code === EMPLOYER_OWNER_UNIQUE_SQLSTATE) return true;
  const message = (error.message ?? "").toLowerCase();
  return (
    message.includes("duplicate key") &&
    (message.includes("owner_user_id") || message.includes("employer_profiles_owner_user_id"))
  );
}

/** First INSERT for an owner succeeds; a concurrent second INSERT is not a new company. */
export function resultFromEmployerOwnerInsert(
  error: EmployerOwnerInsertError | null | undefined,
): EmployerOwnerInsertResult {
  if (!error) return { kind: "created" };
  if (isEmployerOwnerUniqueViolation(error)) return { kind: "already_exists" };
  return { kind: "failed", message: error.message ?? "insert_failed" };
}

export function otherOwnerMayCreateOwnProfile(): boolean {
  return true;
}
