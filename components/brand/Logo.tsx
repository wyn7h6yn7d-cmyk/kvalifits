import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({
  className,
  variant = "wordmark",
}: {
  className?: string;
  variant?: "wordmark" | "icon";
}) {
  const src =
    variant === "icon"
      ? "/brand/kvalifits-mark.png"
      : "/brand/kvalifits-wordmark.png";
  const alt = variant === "icon" ? "Kvalifits ikoon" : "Kvalifits";

  return (
    <Link
      href="/"
      aria-label="Kvalifits avaleht"
      className={cn("inline-flex items-center gap-3", className)}
    >
      <Image
        src={src}
        alt={alt}
        width={variant === "icon" ? 44 : 170}
        height={variant === "icon" ? 44 : 36}
        priority
      />
    </Link>
  );
}

