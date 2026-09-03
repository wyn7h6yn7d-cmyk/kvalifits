"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

import { KF_CHEVRON, KF_EXPAND_BODY, KF_EXPAND_GRID } from "@/lib/site/microMotion";
import { SITE_BODY, SITE_HOME_CARD } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

const PANEL_MOTION =
  "transition-[opacity,transform] duration-[220ms] ease-out motion-reduce:duration-75 motion-reduce:translate-y-0";

export function HomeFaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <article
      className={cn(
        "relative",
        SITE_HOME_CARD,
        open && "border-white/[0.14] bg-[#14141c]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-4 left-0 w-px bg-[var(--accent-pink)]/50 transition-opacity duration-[220ms] ease-out motion-reduce:duration-75",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex min-w-0 w-full cursor-pointer list-none items-start justify-between gap-4 p-6 text-left sm:gap-5 sm:p-7 lg:px-8 lg:py-7",
          "text-pretty rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        <span className="min-w-0 flex-1 pt-0.5 text-[1.0625rem] font-semibold leading-[1.35] tracking-[-0.015em] text-foreground sm:text-[1.125rem] lg:text-[1.1875rem]">
          {question}
        </span>
        <span
          aria-hidden
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-transparent",
            "text-muted transition-[border-color,color] duration-[220ms] ease-out motion-reduce:duration-75",
            open && "border-white/[0.14] text-white/80",
          )}
        >
          <ChevronDown className={cn("h-4 w-4", KF_CHEVRON, open && "rotate-180")} />
        </span>
      </button>
      <div id={panelId} role="region" aria-hidden={!open} className={KF_EXPAND_GRID(open)}>
        <div className="min-h-0 overflow-hidden">
          <div
            className={cn(
              PANEL_MOTION,
              KF_EXPAND_BODY(open),
              open ? "translate-y-0" : "-translate-y-1",
              "border-t border-white/[0.07] px-6 pb-6 pt-5 sm:px-7 sm:pb-7 sm:pt-5 lg:px-8 lg:pb-8",
            )}
          >
            <p className={cn("max-w-prose text-pretty pr-2 sm:pr-4", SITE_BODY, "text-body")}>{answer}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
