import { cn } from "@/lib/utils";
import type { EmployerCompanyVerificationStatus } from "@/lib/employer/companyVerification";
import { companyStatusTone } from "@/lib/verification/statusTone";
import { VerificationStatusBadge } from "@/components/verification/VerificationStatusBadge";

type Props = {
  status: EmployerCompanyVerificationStatus;
  statusLine: string;
  hintLine?: string | null;
  metaLine?: string | null;
  className?: string;
};

export function CompanyVerificationBadge({
  status,
  statusLine,
  hintLine,
  metaLine,
  className,
}: Props) {
  return (
    <div className={cn("min-w-0", className)}>
      <VerificationStatusBadge tone={companyStatusTone(status)} label={statusLine} />
      {hintLine ? (
        <div className="mt-1.5 text-[11px] leading-snug text-white/45">{hintLine}</div>
      ) : null}
      {status === "verified" && metaLine ? (
        <div className="mt-1 text-[11px] leading-snug text-white/45">{metaLine}</div>
      ) : null}
    </div>
  );
}

/** Compact public “verified company” chip — same emerald/shield language as the status badge. */
export function CompanyVerifiedBadge({ label }: { label: string }) {
  return <VerificationStatusBadge tone="verified" label={label} />;
}
