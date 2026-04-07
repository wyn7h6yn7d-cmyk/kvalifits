import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium tracking-wide",
  {
    variants: {
      variant: {
        default: "border-white/[0.10] bg-white/[0.06] text-white/85",
        violet:
          "border-white/[0.12] bg-gradient-to-r from-violet-500/20 via-fuchsia-500/10 to-transparent text-white/90",
        pink:
          "border-white/[0.12] bg-[rgba(227,31,141,0.10)] text-white/90",
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

