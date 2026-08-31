export const ACCOUNT_MFA_ERRORS = {
  NO_FACTOR: "no_factor",
  FACTOR_NOT_OWNED: "factor_not_owned",
  AAL2_REQUIRED: "aal2_required",
} as const;

export type AccountMfaError = (typeof ACCOUNT_MFA_ERRORS)[keyof typeof ACCOUNT_MFA_ERRORS];

export type TotpFactor = {
  id: string;
  status: string;
  friendly_name?: string;
};

export type MfaFactorsPayload = {
  totp?: TotpFactor[];
} | null;

export type AalSnapshot = {
  currentLevel: string | null;
  nextLevel: string | null;
};

export function getVerifiedTotpFactors(factors: MfaFactorsPayload): TotpFactor[] {
  return (factors?.totp ?? []).filter((factor) => factor.status === "verified");
}

export function isAal2(aal: AalSnapshot | null | undefined): boolean {
  return aal?.currentLevel === "aal2";
}

export function resolveVerificationFactor(
  verifiedFactors: TotpFactor[],
  preferredFactorId?: string | null,
): TotpFactor | null {
  if (preferredFactorId) {
    const match = verifiedFactors.find((factor) => factor.id === preferredFactorId);
    if (match) return match;
  }
  return verifiedFactors[0] ?? null;
}

export function canUnenrollFactor(params: {
  verifiedFactors: TotpFactor[];
  factorId: string;
}): { ok: true } | { ok: false; error: AccountMfaError } {
  if (params.verifiedFactors.length === 0) {
    return { ok: false, error: ACCOUNT_MFA_ERRORS.NO_FACTOR };
  }
  if (!params.verifiedFactors.some((factor) => factor.id === params.factorId)) {
    return { ok: false, error: ACCOUNT_MFA_ERRORS.FACTOR_NOT_OWNED };
  }
  return { ok: true };
}

/** Disable 2FA removes every verified factor for the signed-in user. */
export function factorIdsForFullDisable(verifiedFactors: TotpFactor[]): string[] {
  return verifiedFactors.map((factor) => factor.id);
}

export function assertAal2AfterVerify(aal: AalSnapshot | null | undefined):
  | { ok: true }
  | { ok: false; error: AccountMfaError } {
  if (!isAal2(aal)) {
    return { ok: false, error: ACCOUNT_MFA_ERRORS.AAL2_REQUIRED };
  }
  return { ok: true };
}

function errMessage(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || "";
  if (typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    return typeof message === "string" ? message : "";
  }
  return "";
}

function errCode(err: unknown): string {
  if (!err || typeof err !== "object") return "";
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" ? code : "";
}

export function isInvalidMfaCode(err: unknown): boolean {
  const lower = errMessage(err).toLowerCase();
  const code = errCode(err);
  return (
    code === "mfa_verification_failed" ||
    code === "invalid_totp" ||
    lower.includes("invalid totp") ||
    lower.includes("invalid verification code") ||
    lower.includes("invalid code")
  );
}

export function mapAccountMfaError(error: AccountMfaError, t: (key: string) => string): string {
  switch (error) {
    case ACCOUNT_MFA_ERRORS.NO_FACTOR:
      return t("errNoFactor");
    case ACCOUNT_MFA_ERRORS.FACTOR_NOT_OWNED:
      return t("errFactorNotOwned");
    case ACCOUNT_MFA_ERRORS.AAL2_REQUIRED:
      return t("errAal2Required");
    default:
      return t("errDisableFailed");
  }
}
