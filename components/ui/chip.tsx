"use client";

import { X } from "lucide-react";

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
  const base =
    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] leading-tight transition-colors";
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
          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-white/55 hover:text-white/80"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`${label} eemalda`}
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
}

