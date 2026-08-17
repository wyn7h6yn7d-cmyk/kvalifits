import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Clock, Search, ShieldCheck, XCircle } from "lucide-react";

import type { CertificateEffectiveStatus } from "@/lib/seeker/certificateVerification";
import type { EmployerCompanyVerificationStatus } from "@/lib/employer/companyVerification";

/** Shared tones for certificate + company verification badges (same colors/icons everywhere). */
export type VerificationTone =
  | "submitted"
  | "under_review"
  | "verified"
  | "rejected"
  | "expired"
  | "unverified";

export const VERIFICATION_TONE_CLASS: Record<VerificationTone, string> = {
  verified: "border-emerald-400/30 bg-emerald-500/12 text-emerald-100/90",
  under_review: "border-amber-400/30 bg-amber-500/10 text-amber-100/90",
  submitted: "border-white/[0.12] bg-white/[0.04] text-white/65",
  unverified: "border-white/[0.12] bg-white/[0.04] text-white/65",
  rejected: "border-rose-400/30 bg-rose-500/10 text-rose-100/90",
  expired: "border-orange-400/30 bg-orange-500/10 text-orange-100/90",
};

export const VERIFICATION_TONE_ICON: Record<VerificationTone, LucideIcon> = {
  verified: ShieldCheck,
  under_review: Search,
  submitted: Clock,
  unverified: Clock,
  rejected: XCircle,
  expired: AlertTriangle,
};

export function certificateStatusTone(status: CertificateEffectiveStatus): VerificationTone {
  return status;
}

export function companyStatusTone(status: EmployerCompanyVerificationStatus): VerificationTone {
  return status;
}
