"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export function Chip({
  label,
  selected,
  onClick,
  onRemove,
  tone = "default",
  className,
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  tone?: "default" | "violet" | "pink";
  className?: string;
}) {
  const t = useTranslations("jobsSearch");
  const base =
    "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-2 text-[13px] leading-tight transition-colors lg:min-h-0 lg:py-1.5";
  const toneCls =
    tone === "pink"
      ? "border-white/[0.12] bg-[rgba(227,31,141,0.10)] text-white/85"
      : tone === "violet"
        ? "border-white/[0.12] bg-gradient-to-r from-violet-500/18 via-fuchsia-500/10 to-transparent text-white/85"
        : "border-white/[0.10] bg-white/[0.03] text-white/75";
  const selectedCls = selected
    ? "bg-white/[0.06] border-white/[0.16] text-white/90"
    : "hover:bg-white/[0.05] hover:border-white/[0.14]";

  const clickable = typeof onClick === "function";

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!clickable) return;
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
      className={cn(base, toneCls, selectedCls, clickable ? "cursor-pointer" : "", className)}
      aria-pressed={clickable ? !!selected : undefined}
    >
      <span>{label}</span>
      {onRemove ? (
        <button
          type="button"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 hover:text-white/80 lg:h-5 lg:w-5"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={t("removeFilter", { label })}
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
}
