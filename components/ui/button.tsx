import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-white/[0.08] text-white hover:bg-white/[0.12] border border-white/[0.10]",
        primary:
          "bg-gradient-to-r from-violet-500/90 via-fuchsia-500/80 to-pink-500/70 text-white shadow-[0_12px_40px_rgba(168,85,247,0.25)] hover:shadow-[0_16px_60px_rgba(168,85,247,0.33)] border border-white/[0.10]",
        outline:
          "bg-transparent text-white border border-white/[0.14] hover:bg-white/[0.06]",
        ghost: "bg-transparent text-white/90 hover:bg-white/[0.06]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-10 px-4 rounded-lg",
        lg: "h-12 px-6 rounded-2xl text-[15px]",
        icon: "h-11 w-11 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={type ?? (asChild ? undefined : "button")}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

