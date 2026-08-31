"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
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
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed z-[60] h-12 w-12",
        "bottom-[calc(var(--site-bottom-nav-offset,0px)+5.5rem)] right-[max(1.25rem,env(safe-area-inset-right,0px))] lg:bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))]",
      )}
      aria-label={t("scrollToTopAria")}
      title={t("scrollToTopTitle")}
    >
      <ChevronUp className="h-5 w-5 shrink-0" aria-hidden strokeWidth={2} />
    </Button>
  );
}
