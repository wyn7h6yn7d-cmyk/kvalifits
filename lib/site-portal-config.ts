import type { PortalBackgroundVariant, PortalIntensity } from "@/components/site/portal-background";

/**
 * Hero taust: muuda siia, et valida variant ja tugevus.
 * - variant: "a" | "b" | "both" — A = jooned+sõlmed, B = kaardi-outline’id+match, both = mõlemad
 * - intensity: "soft" | "default" | "strong" — vähem / rohkem nähtavust ja liikumist
 */
export const heroPortal: {
  variant: PortalBackgroundVariant;
  intensity: PortalIntensity;
  ambientIntensity: "soft" | "default" | "strong";
} = {
  variant: "both",
  intensity: "default",
  ambientIntensity: "default",
};

/**
 * Teised tumedad sektsioonid (õhuke kiht).
 */
export const subtleSectionPortal: {
  enabled: boolean;
  variant: "b";
  intensity: PortalIntensity;
  /** 0–1: üldine summutaja */
  opacity: number;
} = {
  enabled: true,
  variant: "b",
  intensity: "soft",
  opacity: 0.2,
};
