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

/** Audience / matching — light connection lines + soft glow (never competes with hero). */
export const matchingSectionPortal: {
  enabled: boolean;
  variant: PortalBackgroundVariant;
  intensity: PortalIntensity;
  ambientIntensity: "soft" | "default" | "strong";
  opacity: number;
} = {
  enabled: true,
  variant: "a",
  intensity: "soft",
  ambientIntensity: "soft",
  opacity: 0.22,
};

/** Final CTA — controlled glow only; faint still-feeling lines. */
export const ctaSectionPortal: {
  enabled: boolean;
  variant: PortalBackgroundVariant;
  intensity: PortalIntensity;
  ambientIntensity: "soft" | "default" | "strong";
  opacity: number;
} = {
  enabled: true,
  variant: "a",
  intensity: "soft",
  ambientIntensity: "soft",
  opacity: 0.14,
};

/** @deprecated Prefer matchingSectionPortal / ctaSectionPortal */
export const subtleSectionPortal = matchingSectionPortal;
