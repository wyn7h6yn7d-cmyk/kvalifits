"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

export function HomepageScrollHint() {
  const t = useTranslations("hero");

  return (
    <div className="mt-8 flex justify-center sm:mt-10 lg:mt-12">
      <a
        href="#home-jobs"
        className="group inline-flex flex-col items-center gap-1.5 text-[13px] font-medium text-white/45 transition-colors hover:text-white/72"
      >
        <span>{t("scrollToJobs")}</span>
        <ChevronDown
          className="h-4 w-4 animate-bounce text-white/40 group-hover:text-white/65 motion-reduce:animate-none"
          aria-hidden
        />
      </a>
    </div>
  );
}
