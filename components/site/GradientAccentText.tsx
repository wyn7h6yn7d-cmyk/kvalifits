import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Variant = "brand" | "price";

/** Solid premium tints — no background-clip / transparent text (Word-safe DOM). */
const DISPLAY: Record<Variant, string> = {
  brand: "text-accent-brand-display",
  price: "text-accent-price-display",
};

/**
 * Accent emphasis without gradient text tricks (background-clip + transparent
 * color serializes into Word as dark “highlight” blocks). Solid premium tints only.
 */
export function GradientAccentText({
  children,
  variant = "brand",
  className,
  wrapClassName,
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  wrapClassName?: string;
}) {
  return (
    <span className={cn("relative inline-block align-baseline", DISPLAY[variant], wrapClassName, className)}>
      {children}
    </span>
  );
}
