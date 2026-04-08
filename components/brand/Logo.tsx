"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  imageClassName,
  variant = "wordmark",
}: {
  className?: string;
  /** Näiteks päises kompaktsem kõrgus */
  imageClassName?: string;
  variant?: "wordmark" | "icon";
}) {
  const t = useTranslations("nav");

  return (
    <Link
      href="/"
      aria-label={`${t("home")} — Kvalifits`}
      className={cn("inline-flex items-center gap-3", className)}
    >
      <Image
        className={cn("block object-contain object-left", imageClassName)}
        src={
          variant === "icon"
            ? "/brand/kvalifits-mark-transparent.png"
            : "/brand/kvalifits-wordmark-transparent.png"
        }
        alt={variant === "icon" ? "Kvalifits" : "Kvalifits"}
        width={variant === "icon" ? 52 : 200}
        height={variant === "icon" ? 52 : 42}
        priority
      />
    </Link>
  );
}
