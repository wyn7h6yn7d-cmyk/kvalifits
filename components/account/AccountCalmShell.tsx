import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Calm account chrome: no marketing glow, no nested glass card. */
export function AccountCalmShell({
  title,
  subtitle,
  children,
  maxWidthClassName,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidthClassName?: string;
}) {
  return (
    <div className={cn("mx-auto w-full px-4 pb-16 pt-8 sm:px-6 sm:pt-10", maxWidthClassName ?? "max-w-3xl")}>
      <h1 className="text-balance text-2xl font-semibold tracking-tight text-white">{title}</h1>
      {subtitle ? <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/55">{subtitle}</p> : null}
      <div className="mt-8 space-y-4">{children}</div>
    </div>
  );
}
