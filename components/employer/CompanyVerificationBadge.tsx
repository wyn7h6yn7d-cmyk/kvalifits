import { cn } from "@/lib/utils";
import type { EmployerCompanyVerificationStatus } from "@/lib/employer/companyVerification";

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
      <div
        className={cn(
          "inline-flex max-w-full items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-snug",
          status === "verified" && "border-emerald-400/30 bg-emerald-500/12 text-emerald-100/90",
          status === "under_review" && "border-amber-400/30 bg-amber-500/10 text-amber-100/90",
          status === "unverified" && "border-white/[0.12] bg-white/[0.04] text-white/65"
        )}
      >
        <span className="truncate">{statusLine}</span>
      </div>
      {hintLine ? (
        <div className="mt-1.5 text-[11px] leading-snug text-white/45">{hintLine}</div>
      ) : null}
      {status === "verified" && metaLine ? (
        <div className="mt-1 text-[11px] leading-snug text-white/45">{metaLine}</div>
      ) : null}
    </div>
  );
}
