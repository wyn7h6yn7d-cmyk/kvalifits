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
        "h-11 w-full rounded-2xl border border-border bg-[#12121a] px-4 font-sans text-base leading-snug text-foreground placeholder:text-muted-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition-[border-color,background-color,box-shadow] focus:border-violet-400/40 focus:bg-[#14141f]",
        className
      )}
      {...props}
    />
  );
}
