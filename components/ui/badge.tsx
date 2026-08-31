import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.8125rem] font-medium leading-snug",
  {
    variants: {
      variant: {
        default: "border-border bg-[#f8fafc] text-foreground/80",
        violet:
          "border-[rgba(37,99,235,0.16)] bg-[rgba(37,99,235,0.06)] text-primary",
        pink:
          "border-[rgba(227,31,141,0.18)] bg-[rgba(227,31,141,0.06)] text-[#c21875]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
