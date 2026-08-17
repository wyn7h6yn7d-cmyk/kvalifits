"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

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

  return (
    <Link
      href="/"
      aria-label={t("brandHome")}
      className={cn("inline-flex items-center gap-3", className)}
    >
      <Image
        className={cn("block object-contain object-left", imageClassName)}
        src={
          isIcon
            ? "/brand/kvalifits-mark-transparent.png"
            : "/brand/kvalifits-wordmark-transparent.png"
        }
        alt="Kvalifits"
        width={isIcon ? 52 : 240}
        height={isIcon ? 52 : 50}
        sizes={isIcon ? "52px" : "(max-width: 640px) 168px, 220px"}
        quality={75}
        priority={priority}
      />
    </Link>
  );
}
