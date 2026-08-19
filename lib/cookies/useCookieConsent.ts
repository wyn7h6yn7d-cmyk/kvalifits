"use client";

import { useSyncExternalStore } from "react";

import {
  getCookieConsentSnapshot,
  subscribeCookieConsent,
  type CookieConsentState,
} from "@/lib/cookies/consent";

const subscribeNever = () => () => {};

/** Client-only flag without a mount effect (avoids hydration mismatch). */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}

export function useCookieConsent(): CookieConsentState | null {
  return useSyncExternalStore(subscribeCookieConsent, getCookieConsentSnapshot, () => null);
}
