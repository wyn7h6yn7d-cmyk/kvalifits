import { cn } from "@/lib/utils";
import type { CertificateEffectiveStatus } from "@/lib/seeker/certificateVerification";

type Props = {
  status: CertificateEffectiveStatus;
  statusLine: string;
  metaLine?: string | null;
  warningLine?: string | null;
  className?: string;
};

export function CertificateVerificationBadge({
  status,
  statusLine,
  metaLine,
  warningLine,
  className,
}: Props) {
  return (
    <div className={cn("min-w-0", className)}>
      <div
        className={cn(
          "inline-flex max-w-full items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-snug",
          status === "verified" && "border-emerald-400/30 bg-emerald-500/12 text-emerald-100/90",
          status === "under_review" && "border-amber-400/30 bg-amber-500/10 text-amber-100/90",
          status === "submitted" && "border-white/[0.12] bg-white/[0.04] text-white/65",
          status === "expired" && "border-rose-400/30 bg-rose-500/10 text-rose-100/90"
        )}
      >
        <span className="truncate">{statusLine}</span>
      </div>
      {(status === "verified" || status === "expired") && metaLine ? (
        <div className="mt-1 text-[11px] leading-snug text-white/45">{metaLine}</div>
      ) : null}
      {warningLine ? (
        <div className="mt-1 text-[11px] leading-snug text-amber-200/85">{warningLine}</div>
      ) : null}
    </div>
  );
}
