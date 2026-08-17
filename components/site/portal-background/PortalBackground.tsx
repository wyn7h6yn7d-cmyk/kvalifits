"use client";

import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";

import type { PortalIntensity } from "./portal-tokens";
import { PortalBackgroundVariantA } from "./PortalBackgroundVariantA";

export type PortalBackgroundVariant = "a" | "b" | "both";

const PortalBackgroundVariantB = dynamic(
  () =>
    import("./PortalBackgroundVariantB").then((m) => ({
      default: m.PortalBackgroundVariantB,
    })),
  { ssr: false },
);

export function PortalBackground({
  variant,
  intensity = "default",
  className,
}: {
  variant: PortalBackgroundVariant;
  intensity?: PortalIntensity;
  className?: string;
}) {
  if (variant === "a") {
    return <PortalBackgroundVariantA intensity={intensity} className={className} />;
  }
  if (variant === "b") {
    return <PortalBackgroundVariantB intensity={intensity} className={className} />;
  }

  return (
    <div className={cn("pointer-events-none absolute inset-0", className)}>
      <div className="absolute inset-0 opacity-[0.85]">
        <PortalBackgroundVariantA intensity={intensity} />
      </div>
      <div className="absolute inset-0 hidden opacity-[0.72] lg:block">
        <PortalBackgroundVariantB intensity={intensity} />
      </div>
    </div>
  );
}
