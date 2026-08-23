import { cn } from "@/lib/utils";
import {
  VERIFICATION_TONE_CLASS,
  VERIFICATION_TONE_ICON,
  type VerificationTone,
} from "@/lib/verification/statusTone";

type Props = {
  tone: VerificationTone;
  label: string;
  className?: string;
};

/** Compact status chip — same icon/color language for certificates and companies. */
export function VerificationStatusBadge({ tone, label, className }: Props) {
  const Icon = VERIFICATION_TONE_ICON[tone];
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-snug",
        VERIFICATION_TONE_CLASS[tone],
        className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      <span className="min-w-0 break-words text-pretty leading-snug">{label}</span>
    </span>
  );
}
