import type { ReactNode } from "react";

import { Bone } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

/** Matches AccountCalmShell spacing so dashboard loading does not jump the page chrome. */
export function AccountCalmLoadingFrame({
  children,
  maxWidthClassName,
}: {
  children: ReactNode;
  maxWidthClassName?: string;
}) {
  return (
    <div className={cn("mx-auto w-full px-4 pb-10 pt-6 sm:px-6 sm:pb-16 sm:pt-10", maxWidthClassName ?? "max-w-3xl")}>
      <Bone className="h-8 w-48 rounded-lg" />
      <Bone className="mt-3 h-4 w-72 max-w-full" />
      <div className="mt-8">{children}</div>
    </div>
  );
}

/** Matches AuthShell card bounds without duplicating navbar/footer. */
export function AccountAuthLoadingFrame({
  children,
  maxWidthClassName,
}: {
  children: ReactNode;
  maxWidthClassName?: string;
}) {
  return (
    <div className="relative flex min-h-[100dvh] items-start justify-center pt-10 pb-16 lg:min-h-[calc(100dvh-var(--site-header-offset))] lg:pt-16 lg:pb-24">
      <div className={cn("relative w-full px-4 sm:px-6", maxWidthClassName ?? "max-w-md")}>
        <div className="rounded-3xl border border-border bg-[#f8fafc] p-5 sm:p-8">
          <Bone className="h-8 w-44 rounded-lg" />
          <Bone className="mt-3 h-4 w-64 max-w-full" />
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </div>
  );
}
