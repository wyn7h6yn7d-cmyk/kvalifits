import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";

export function Logo({
  className,
  variant = "wordmark",
}: {
  className?: string;
  variant?: "wordmark" | "icon";
}) {
  return (
    <Link
      href="/"
      aria-label="Kvalifits avaleht"
      className={cn("inline-flex items-center gap-3", className)}
    >
      <Image
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

