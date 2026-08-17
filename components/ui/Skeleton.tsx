import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Bone({ className }: { className?: string }) {
  return <div className={cn("kf-skeleton rounded-md", className)} />;
}

export function SkeletonRegion({
  label,
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      {label ? <span className="sr-only">{label}</span> : null}
      <div aria-hidden="true">{children}</div>
    </div>
  );
}
