"use client";

import { cn } from "@/lib/utils";

import type { PortalIntensity } from "./portal-tokens";
import { PortalBackgroundVariantA } from "./PortalBackgroundVariantA";
import { PortalBackgroundVariantB } from "./PortalBackgroundVariantB";

export type PortalBackgroundVariant = "a" | "b" | "both";

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

  /* Mõlemad kihid: summutatud, et summa ei läheks lärmakaks */
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)}>
      <div className="absolute inset-0 opacity-[0.85]">
        <PortalBackgroundVariantA intensity={intensity} />
      </div>
      <div className="absolute inset-0 opacity-[0.72]">
        <PortalBackgroundVariantB intensity={intensity} />
      </div>
    </div>
  );
}
