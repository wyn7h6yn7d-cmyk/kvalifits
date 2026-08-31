import { ChevronDown } from "lucide-react";

import { SITE_BODY, SITE_HOME_CARD } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

export function HomeFaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details
      className={cn(
        "group relative",
        SITE_HOME_CARD,
        "group open:border-violet-400/22",
        "open:shadow-[0_24px_64px_-36px_rgba(79,70,229,0.18),inset_0_1px_0_rgba(255,255,255,0.09),0_0_0_1px_rgba(129,140,248,0.06)]",
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-3 left-0 w-px bg-gradient-to-b from-transparent via-violet-400/45 to-transparent opacity-0 transition-opacity duration-300 group-open:opacity-100"
      />
      <summary
        className={cn(
          "flex min-w-0 cursor-pointer list-none items-start justify-between gap-4 p-5 sm:gap-5 sm:p-6",
          "text-pretty marker:content-none [&::-webkit-details-marker]:hidden",
          "rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        <span className="min-w-0 flex-1 pt-0.5 text-[1.0625rem] font-semibold leading-[1.35] tracking-[-0.015em] text-foreground sm:text-[1.125rem]">
          {question}
        </span>
        <span
          aria-hidden
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.04]",
            "text-muted transition-[border-color,background-color,color,transform] duration-300 ease-out",
            "group-open:border-violet-400/28 group-open:bg-violet-500/[0.1] group-open:text-violet-200/90",
          )}
        >
          <ChevronDown className="h-4 w-4 transition-transform duration-300 ease-out group-open:rotate-180" />
        </span>
      </summary>
      <div className="border-t border-white/[0.07] px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
        <p className={cn("max-w-prose text-pretty pr-2 sm:pr-4", SITE_BODY, "text-body")}>{answer}</p>
      </div>
    </details>
  );
}
