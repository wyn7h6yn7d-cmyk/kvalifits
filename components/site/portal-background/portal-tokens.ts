/** Visuaalse tugevuse skaala — üks koht, kust Hero + sektsioonid saavad ühise keele. */
export type PortalIntensity = "soft" | "default" | "strong";

export function portalLayerOpacity(intensity: PortalIntensity): number {
  switch (intensity) {
    case "soft":
      return 0.55;
    case "strong":
      return 0.95;
    default:
      return 0.78;
  }
}

/** >1 = aeglasem animatsioon (vähem “elav”). */
export function portalDurationScale(intensity: PortalIntensity): number {
  switch (intensity) {
    case "soft":
      return 1.45;
    case "strong":
      return 0.88;
    default:
      return 1;
  }
}
