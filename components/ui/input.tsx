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
        "h-12 w-full rounded-2xl border border-white/[0.10] bg-[#12121a] px-4 font-sans text-base text-white/85 placeholder:text-white/35 shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none transition-[border-color,background-color] focus:border-white/[0.18] focus:bg-[#16161f] lg:h-11 lg:text-sm",
        className
      )}
      {...props}
    />
  );
}

