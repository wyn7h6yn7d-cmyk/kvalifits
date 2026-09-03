import type { PortalBackgroundVariant, PortalIntensity } from "@/components/site/portal-background";

/** Hero motion — dim animated backdrop behind copy + search. */
export const heroPortal: {
  variant: PortalBackgroundVariant;
  intensity: PortalIntensity;
  ambientIntensity: "soft" | "default" | "strong";
} = {
  variant: "a",
  intensity: "soft",
  ambientIntensity: "soft",
};
