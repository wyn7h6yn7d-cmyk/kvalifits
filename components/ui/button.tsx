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

/** Secondary CTA: white surface, blue + pink edge, no fill shout. */
const secondarySurface =
  "border border-[rgba(37,99,235,0.22)] bg-white text-foreground shadow-[inset_0_0_0_1px_rgba(227,31,141,0.1)] hover:border-[rgba(37,99,235,0.38)] hover:bg-surface hover:shadow-[inset_0_0_0_1px_rgba(227,31,141,0.16)] active:bg-[#eef2f7]";

const buttonVariants = cva(
  "relative isolate inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-sans text-[0.9375rem] font-medium leading-snug transition-[color,background-color,border-color,box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 max-lg:whitespace-normal [&_svg]:pointer-events-none [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "border border-[rgba(29,78,216,0.9)] bg-primary text-white shadow-[inset_0_0_0_1px_rgba(227,31,141,0.18)] hover:border-[rgba(30,64,175,1)] hover:bg-primary-hover hover:shadow-[inset_0_0_0_1px_rgba(227,31,141,0.24)] active:bg-[#1e40af]",
        default: secondarySurface,
        outline: secondarySurface,
        ghost:
          "border border-transparent bg-transparent text-muted shadow-none hover:bg-surface hover:text-foreground",
      },
      size: {
        /** Standard page control — shared height/padding for primary + secondary. */
        default: "h-11 px-5",
        /** Compact chrome (nav, dense toolbars). Same radius/typography/border as default. */
        sm: "h-9 px-4",
        /** Taller for key form submits; same typography and radius. */
        lg: "h-12 px-6",
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
        <span className={cn("inline-flex items-center justify-center gap-2", isLoading && loadingText == null && "opacity-90")}>
          {content}
        </span>
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
