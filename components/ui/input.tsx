import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({
  className,
  type,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "h-11 w-full rounded-2xl border border-border bg-white px-4 font-sans text-base leading-snug text-foreground placeholder:text-muted-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-[border-color,background-color,box-shadow] focus:border-[rgba(37,99,235,0.35)] focus:bg-white",
        className
      )}
      {...props}
    />
  );
}
