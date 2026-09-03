import type { PortalBackgroundVariant, PortalIntensity } from "@/components/site/portal-background";

/** Hero motion — animated Human Premium backdrop behind copy + search. */
export const heroPortal: {
  variant: PortalBackgroundVariant;
  intensity: PortalIntensity;
  ambientIntensity: "soft" | "default" | "strong";
} = {
  variant: "a",
  intensity: "default",
  ambientIntensity: "default",
};
