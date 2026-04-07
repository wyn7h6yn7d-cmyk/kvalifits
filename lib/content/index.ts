import { landingET } from "./landing.et";

export type SupportedLocale = "et" | "en";

export function getLandingContent(locale: SupportedLocale = "et") {
  // Future-ready: add landingEN and switch when ready.
  if (locale === "en") return landingET;
  return landingET;
}

