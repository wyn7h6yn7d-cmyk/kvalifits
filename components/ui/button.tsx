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

/** Solid indigo-violet — accent via border + glow, not a loud gradient fill. */
const primarySurface =
  "border border-[rgba(129,140,248,0.32)] bg-[#4f46e5] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_32px_-14px_rgba(79,70,229,0.55),0_0_24px_-16px_rgba(227,31,141,0.18)] hover:border-[rgba(167,139,250,0.42)] hover:bg-[#554deb] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_14px_40px_-12px_rgba(99,102,241,0.52),0_0_28px_-14px_rgba(227,31,141,0.22)] active:border-[rgba(129,140,248,0.28)] active:bg-[#4338ca]";

/** Dark glass — fine single-pixel border, restrained hover. */
const secondarySurface =
  "border border-white/[0.09] bg-white/[0.035] text-foreground/92 shadow-none hover:border-white/[0.14] hover:bg-white/[0.055] hover:text-foreground active:bg-white/[0.03]";

const buttonVariants = cva(
  "relative isolate inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-sans text-[0.9375rem] font-medium leading-snug transition-[color,background-color,border-color,box-shadow] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 max-lg:whitespace-normal [&_svg]:pointer-events-none [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: primarySurface,
        default: secondarySurface,
        outline: secondarySurface,
        ghost:
          "border border-transparent bg-transparent text-muted shadow-none hover:bg-white/[0.045] hover:text-foreground",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-[0.875rem]",
        lg: "h-12 px-6 text-base font-semibold",
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
  loading?: boolean;
  loadingText?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, loading, loadingText, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const isLoading = Boolean(loading);
    const isDisabled = Boolean(disabled) || isLoading;
    const content = isLoading && loadingText != null ? loadingText : children;

    if (asChild) {
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
