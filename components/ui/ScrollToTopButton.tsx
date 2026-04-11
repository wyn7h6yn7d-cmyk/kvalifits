"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const SHOW_AFTER_PX = 280;

export function ScrollToTopButton() {
  const t = useTranslations("footer");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed z-[60]",
        "bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))] right-[max(1.25rem,env(safe-area-inset-right,0px))]",
        "flex h-12 w-12 items-center justify-center rounded-2xl",
        "border border-white/[0.12] bg-white/[0.06] text-white/88 shadow-[0_14px_60px_-34px_rgba(0,0,0,0.75)] backdrop-blur-xl",
        "transition-colors hover:border-white/[0.16] hover:bg-white/[0.09]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgba(168,85,247,0.75)] focus-visible:outline-offset-2"
      )}
      aria-label={t("scrollToTopAria")}
      title={t("scrollToTopTitle")}
    >
      <ChevronUp className="h-5 w-5 shrink-0" aria-hidden strokeWidth={2} />
    </button>
  );
}
