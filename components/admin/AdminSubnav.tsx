"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const ITEMS: { href: string; key: string; exact?: boolean }[] = [
  { href: "/admin", key: "navHome", exact: true },
  { href: "/admin/moderation", key: "navModeration" },
  { href: "/admin/jobs", key: "navJobs" },
  { href: "/admin/employers", key: "navEmployers" },
  { href: "/admin/users", key: "navUsers" },
  { href: "/admin/reports", key: "navReports" },
  { href: "/admin/audit", key: "navAudit" },
  { href: "/admin/security", key: "navSecurity" },
];

export function AdminSubnav() {
  const t = useTranslations("admin");
  const pathname = usePathname();

  return (
    <nav aria-label={t("navLabel")} className="overflow-x-auto">
      <div className="flex min-w-max gap-1">
        {ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex h-9 shrink-0 items-center rounded-xl px-3 text-[13px] font-medium transition-colors",
                active
                  ? "bg-white/[0.10] text-white"
                  : "text-white/60 hover:bg-white/[0.05] hover:text-white/85",
              )}
            >
              {t(item.key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
