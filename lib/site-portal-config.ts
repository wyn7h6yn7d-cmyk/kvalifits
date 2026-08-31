import type { PortalBackgroundVariant, PortalIntensity } from "@/components/site/portal-background";

/** Hero motion — readable but visibly alive. */
export const heroPortal: {
  variant: PortalBackgroundVariant;
  intensity: PortalIntensity;
  ambientIntensity: "soft" | "default" | "strong";
} = {
  variant: "a",
  intensity: "default",
  ambientIntensity: "default",
};
