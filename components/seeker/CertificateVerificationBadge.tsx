import { cn } from "@/lib/utils";
import {
  buildCertificateVerificationView,
  parseCertificateVerificationStatus,
  type CertificateEffectiveStatus,
  type CertificateVerificationFields,
  type CertificateVerificationViewLabels,
} from "@/lib/seeker/certificateVerification";
import { VerificationStatusBadge } from "@/components/verification/VerificationStatusBadge";

type BadgeProps = {
  status: CertificateEffectiveStatus;
  statusLabel: string;
  name?: string | null;
  sourceLine?: string | null;
  verifiedOnLine?: string | null;
  validUntilLine?: string | null;
  previouslyVerifiedLine?: string | null;
  warningLine?: string | null;
  className?: string;
};

export function CertificateVerificationBadge({
  status,
  statusLabel,
  name,
  sourceLine,
  verifiedOnLine,
  validUntilLine,
  previouslyVerifiedLine,
  warningLine,
  className,
}: BadgeProps) {
  const meta = [sourceLine, verifiedOnLine, validUntilLine, previouslyVerifiedLine].filter(Boolean) as string[];
  return (
    <div className={cn("min-w-0", className)}>
      {name ? <div className="text-sm font-medium leading-snug text-white/88">{name}</div> : null}
      <div className={name ? "mt-1.5" : undefined}>
        <VerificationStatusBadge tone={status} label={statusLabel} />
      </div>
      {meta.length ? (
        <div className="mt-1 space-y-0.5 text-[11px] leading-snug text-white/45">
          {meta.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      ) : null}
      {warningLine ? (
        <div className="mt-1 text-[11px] leading-snug text-amber-200/85">{warningLine}</div>
      ) : null}
    </div>
  );
}

type BlockProps = {
  name?: string | null;
  fields: Pick<
    CertificateVerificationFields,
    "verification_status" | "verified_at" | "verification_source" | "certificate_valid_until"
  > & { certificate_issuer?: string | null };
  labels: CertificateVerificationViewLabels;
  locale: string;
  warningLine?: string | null;
  className?: string;
};

export function CertificateStatusBlock({
  name,
  fields,
  labels,
  locale,
  warningLine,
  className,
}: BlockProps) {
  const view = buildCertificateVerificationView(fields, labels, locale);
  const previouslyVerifiedLine =
    view.status === "expired" &&
    parseCertificateVerificationStatus(fields.verification_status) === "verified" &&
    labels.previouslyVerified
      ? labels.previouslyVerified
      : null;

  return (
    <CertificateVerificationBadge
      name={name}
      status={view.status}
      statusLabel={view.statusLabel}
      sourceLine={view.sourceLine}
      verifiedOnLine={view.verifiedOnLine}
      validUntilLine={view.validUntilLine}
      previouslyVerifiedLine={previouslyVerifiedLine}
      warningLine={warningLine}
      className={className}
    />
  );
}

export function certificateViewLabelsFromT(
  t: (key: string, values?: Record<string, string | number>) => string,
): CertificateVerificationViewLabels {
  return {
    submitted: t("certificateStatus.submitted"),
    under_review: t("certificateStatus.under_review"),
    verified: t("certificateStatus.verified"),
    rejected: t("certificateStatus.rejected"),
    expired: t("certificateStatus.expired"),
    source: (source) => t("certificateSource", { source }),
    verifiedOn: (date) => t("certificateVerifiedOn", { date }),
    validUntil: (date) => t("certificateValidUntilLine", { date }),
    previouslyVerified: t("certificatePreviouslyVerified"),
  };
}
