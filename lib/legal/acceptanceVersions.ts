import { privacyET } from "@/lib/content/legal/privacy.et";
import { termsET } from "@/lib/content/legal/terms.et";

/**
 * Canonical acceptance versions stored on `profiles` at registration.
 * Bump by updating `lastUpdated` on the ET legal documents (source of truth).
 */
export const CURRENT_TERMS_VERSION = termsET.lastUpdated;
export const CURRENT_PRIVACY_VERSION = privacyET.lastUpdated;
