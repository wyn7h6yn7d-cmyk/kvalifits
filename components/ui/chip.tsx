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
    "inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border px-3 py-2 text-[0.9375rem] leading-snug transition-colors lg:min-h-0 lg:py-1.5";
  const toneCls =
    tone === "pink"
      ? "border-[rgba(227,31,141,0.18)] bg-[rgba(227,31,141,0.06)] text-foreground/80"
      : tone === "violet"
        ? "border-[rgba(37,99,235,0.16)] bg-[rgba(37,99,235,0.06)] text-foreground/80"
        : "border-border bg-white/[0.04] text-muted";
  const selectedCls = selected
    ? "border-violet-400/28 bg-violet-500/10 text-foreground"
    : "hover:border-white/[0.13] hover:bg-white/[0.05]";

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
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-2 hover:text-foreground lg:h-5 lg:w-5"
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
