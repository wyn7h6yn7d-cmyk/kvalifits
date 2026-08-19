import type { PortalBackgroundVariant, PortalIntensity } from "@/components/site/portal-background";

/**
 * Landing visual rhythm — hero carries the “wow”; other sections support it.
 */
export const heroPortal: {
  variant: PortalBackgroundVariant;
  intensity: PortalIntensity;
  ambientIntensity: "soft" | "default" | "strong";
} = {
  variant: "a",
  intensity: "default",
  ambientIntensity: "strong",
};
