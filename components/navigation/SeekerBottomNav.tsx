"use client";

import { Briefcase, FileText, Target, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/routing";
import { SEEKER_BOTTOM_NAV, type NavKey } from "@/lib/navigation/navConfig";
import { cn } from "@/lib/utils";

const ICONS: Partial<Record<NavKey, typeof Briefcase>> = {
  jobsShort: Briefcase,
  seekerMatchesShort: Target,
  seekerApplications: FileText,
  seekerProfile: UserRound,
};

function isActive(pathname: string, href: string) {
  if (href === "/tood") return pathname === "/tood" || pathname.startsWith("/tood/");
  if (href === "/account/seeker/profile") {
    return pathname === "/account/seeker/profile" || pathname.startsWith("/account/seeker/profile/");
  }
  if (href === "/account/seeker/applications") {
    return pathname === "/account/seeker/applications" || pathname.startsWith("/account/seeker/applications/");
  }
  if (href === "/account/seeker/matches") {
    return pathname === "/account/seeker/matches" || pathname.startsWith("/account/seeker/matches/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SeekerBottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label={t("seekerMobileNav")}
    >
      <div className="mx-auto grid h-[var(--site-bottom-nav-height)] max-w-lg grid-cols-4">
        {SEEKER_BOTTOM_NAV.map((item) => {
          const Icon = ICONS[item.key] ?? Briefcase;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[var(--site-bottom-nav-height)] min-w-0 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium leading-none transition-colors",
                active ? "text-foreground" : "text-muted-2 hover:text-foreground",
              )}
            >
              <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-primary")} aria-hidden />
              <span className="max-w-full truncate">{t(item.key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
