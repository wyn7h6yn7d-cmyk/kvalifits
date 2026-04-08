import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

/** Kõik lehed on `app/[locale]/...` all; middleware suunab `/` → `/et` (või küpsises olev keel). */
export const routing = defineRouting({
  locales: ["et", "en", "ru"],
  defaultLocale: "et",
  localePrefix: "always",
  localeCookie: {
    name: "NEXT_LOCALE",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  },
});

export type AppLocale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
