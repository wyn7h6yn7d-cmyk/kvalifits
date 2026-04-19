import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("h-4 w-4 animate-spin text-current opacity-80", className)}
    >
      <path
        fill="currentColor"
        d="M12 22a10 10 0 1 1 10-10h-2a8 8 0 1 0-8 8v2z"
      />
    </svg>
  );
}

const buttonVariants = cva(
  "relative isolate inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-sans text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-white/[0.08] text-white hover:bg-white/[0.12] border border-white/[0.10]",
        primary:
          "overflow-hidden border border-transparent bg-transparent text-white shadow-[0_12px_40px_rgba(168,85,247,0.25)] hover:shadow-[0_16px_60px_rgba(168,85,247,0.33)] ring-1 ring-white/[0.14] ring-inset before:content-[''] before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-gradient-to-r before:from-violet-500/90 before:via-fuchsia-500/80 before:to-[rgba(227,31,141,0.70)] after:content-[''] after:absolute after:inset-[1px] after:-z-10 after:rounded-[calc(0.75rem-1px)] after:bg-[rgba(0,0,0,0.10)]",
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
  /** When true, show spinner and disable interactions. */
  loading?: boolean;
  /** Optional label to render while loading. */
  loadingText?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, loading, loadingText, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const isLoading = Boolean(loading);
    const isDisabled = Boolean(disabled) || isLoading;
    const content = isLoading && loadingText != null ? loadingText : children;

    if (asChild) {
      // Radix Slot requires exactly one React element child; we can't inject spinner markup.
      return (
        <Comp
          ref={ref}
          type={type ?? undefined}
          aria-busy={isLoading ? true : undefined}
          aria-disabled={isDisabled ? true : undefined}
          className={cn(
            buttonVariants({ variant, size }),
            isDisabled && "pointer-events-none opacity-60",
            className
          )}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        ref={ref}
        type={type ?? "button"}
        aria-busy={isLoading ? true : undefined}
        disabled={isDisabled}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {isLoading ? <Spinner /> : null}
        <span className={cn(isLoading && loadingText == null && "opacity-90")}>{content}</span>
      </Comp>
    );
  }
);
Button.displayName = "Button";

