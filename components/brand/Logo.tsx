"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

function Wordmark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 152 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <text
        x="0"
        y="29"
        fontFamily="var(--font-ibm-plex-sans), 'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif"
        fontSize="28"
        fontWeight="600"
        letterSpacing="-0.35"
        fill="currentColor"
      >
        kvalifits
      </text>
      <circle cx="144" cy="27.5" r="4" fill="var(--accent-pink)" />
    </svg>
  );
}

function Mark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <text
        x="4"
        y="29"
        fontFamily="var(--font-ibm-plex-sans), 'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif"
        fontSize="26"
        fontWeight="600"
        letterSpacing="-0.8"
        fill="currentColor"
      >
        k
      </text>
      <circle cx="32" cy="28" r="4" fill="var(--accent-pink)" />
    </svg>
  );
}

export function Logo({
  className,
  imageClassName,
  variant = "wordmark",
  priority = false,
}: {
  className?: string;
  /** Näiteks päises kompaktsem kõrgus */
  imageClassName?: string;
  variant?: "wordmark" | "icon";
  /** Set true only for the header mark (LCP). Footer stays lazy. */
  priority?: boolean;
}) {
  const t = useTranslations("nav");
  const isIcon = variant === "icon";
  void priority;

  return (
    <Link
      href="/"
      aria-label={t("brandHome")}
      className={cn("inline-flex items-center gap-3 text-foreground", className)}
    >
      {isIcon ? (
        <Mark className={cn("block h-9 w-9 text-foreground", imageClassName)} />
      ) : (
        <Wordmark
          className={cn("block h-8 w-auto text-foreground sm:h-9", imageClassName)}
        />
      )}
    </Link>
  );
}
