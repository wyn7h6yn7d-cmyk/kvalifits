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
  verified: "border-emerald-200 bg-emerald-50 text-emerald-800",
  under_review: "border-amber-200 bg-amber-50 text-amber-800",
  submitted: "border-border bg-[#f8fafc] text-muted",
  unverified: "border-border bg-[#f8fafc] text-muted",
  rejected: "border-rose-200 bg-rose-50 text-rose-800",
  expired: "border-orange-200 bg-orange-50 text-orange-800",
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
