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
        open &&
          "border-violet-400/22 shadow-[0_24px_64px_-36px_rgba(79,70,229,0.18),inset_0_1px_0_rgba(255,255,255,0.09),0_0_0_1px_rgba(129,140,248,0.06)]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-3 left-0 w-px bg-gradient-to-b from-transparent via-violet-400/45 to-transparent transition-opacity duration-[220ms] ease-out motion-reduce:duration-75",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex min-w-0 w-full cursor-pointer list-none items-start justify-between gap-4 p-6 text-left sm:gap-5 sm:p-7 lg:p-8",
          "text-pretty rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        <span className="min-w-0 flex-1 pt-0.5 text-[1.0625rem] font-semibold leading-[1.35] tracking-[-0.015em] text-foreground sm:text-[1.125rem] lg:text-[1.1875rem]">
          {question}
        </span>
        <span
          aria-hidden
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.04]",
            "text-muted transition-[border-color,background-color,color] duration-[220ms] ease-out motion-reduce:duration-75",
            open && "border-violet-400/28 bg-violet-500/[0.1] text-violet-200/90",
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
