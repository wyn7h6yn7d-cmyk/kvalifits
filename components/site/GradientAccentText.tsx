import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Variant = "brand" | "price";

const STACK: Record<Variant, string> = {
  brand: "text-gradient-brand-stack",
  price: "text-gradient-price-stack",
};

const DECOR: Record<Variant, string> = {
  brand: "text-gradient-brand-decorative",
  price: "text-gradient-price-decorative",
};

const PLAIN: Record<Variant, string> = {
  brand: "text-gradient-brand-plain",
  price: "text-gradient-price-plain",
};

/**
 * Gradient on screen; clipboard gets plain text (avoids Word pasting dark
 * rectangles from background-clip + transparent color on a single span).
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
    <span className={cn(STACK[variant], wrapClassName, className)}>
      <span aria-hidden className={DECOR[variant]}>
        {children}
      </span>
      <span className={PLAIN[variant]}>{children}</span>
    </span>
  );
}
