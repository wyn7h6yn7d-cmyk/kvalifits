"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export type FitReasonRow = {
  status: "pass" | "partial" | "gap";
  text: string;
};

type Props = {
  score: number | null;
  label: string;
  whyLabel: string;
  hideLabel: string;
  reasons: FitReasonRow[];
};

/** Compact fit % with optional human-readable “why” reasons. */
export function FitScoreExplain({ score, label, whyLabel, hideLabel, reasons }: Props) {
  const [open, setOpen] = useState(false);
  const hasScore = score !== null;

  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</div>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <div className="text-2xl font-semibold tabular-nums text-white/95">
          {hasScore ? `${score}%` : "—"}
        </div>
        {hasScore && reasons.length ? (
          <button
            type="button"
            className="text-sm text-white/55 underline-offset-4 hover:text-white/85 hover:underline"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? hideLabel : whyLabel}
          </button>
        ) : null}
      </div>

      {open && reasons.length ? (
        <ul className="mt-3 space-y-1.5 rounded-2xl border border-white/[0.08] bg-black/20 px-3.5 py-3">
          {reasons.map((r) => (
            <li key={`${r.status}-${r.text}`} className="flex items-start gap-2 text-[13px] leading-snug">
              <span
                className={cn(
                  "mt-px shrink-0 font-semibold",
                  r.status === "pass" && "text-emerald-300/90",
                  r.status === "partial" && "text-amber-200/80",
                  r.status === "gap" && "text-white/35"
                )}
                aria-hidden
              >
                {r.status === "pass" ? "✓" : "○"}
              </span>
              <span
                className={cn(
                  r.status === "pass" && "text-white/82",
                  r.status === "partial" && "text-white/65",
                  r.status === "gap" && "text-white/48"
                )}
              >
                {r.text}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
