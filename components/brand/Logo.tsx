"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const WORDMARK_SRC = "/brand/kvalifits-wordmark-transparent.png";
const MARK_SRC = "/brand/kvalifits-mark-transparent.png";

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
      className={cn("inline-flex shrink-0 items-center", className)}
    >
      <Image
        className={cn("block object-contain object-left", imageClassName)}
        src={isIcon ? MARK_SRC : WORDMARK_SRC}
        alt="Kvalifits"
        width={isIcon ? 52 : 500}
        height={isIcon ? 52 : 500}
        sizes={isIcon ? "52px" : "(max-width: 640px) 192px, 240px"}
        quality={75}
        priority={priority}
      />
    </Link>
  );
}
