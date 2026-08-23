import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";

const LEGAL_PATHS = [
  { href: "/privaatsus", key: "privacyPolicy" as const },
  { href: "/tingimused", key: "terms" as const },
  { href: "/kupsised", key: "cookies" as const },
] as const;

const PLATFORM_PATHS = [
  { href: "/tood", key: "jobs" as const },
  { href: "/toootsijatele", key: "forSeekers" as const },
  { href: "/tooandjatele", key: "forEmployers" as const },
  { href: "/ettevotted", key: "companies" as const },
] as const;

const footerNavLinkClass = "block text-[15px] leading-6 text-body hover:text-foreground";

type Props = {
  /** Tighter spacing/grid for the jobs listing experience. Layout only — no content changes. */
  compact?: boolean;
};

export async function Footer({ compact = false }: Props) {
  const tn = await getTranslations("nav");
  const t = await getTranslations("footer");

  return (
    <footer
      className={cn(
        "border-t border-white/[0.06] bg-surface",
        compact && "-mt-4 sm:-mt-5 lg:-mt-6",
      )}
    >
      <Container>
        <div className={cn(compact ? "py-8 sm:py-9" : "py-12")}>
          <div
            className={cn(
              "grid grid-cols-1 items-start",
              compact
                ? "gap-y-8 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)] sm:gap-x-6 lg:gap-x-8"
                : "gap-x-0 gap-y-10 sm:grid-cols-6 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-0 xl:gap-x-10",
            )}
          >
            <div
              className={cn(
                "flex min-w-0 flex-col",
                compact ? "gap-2" : "gap-3 sm:col-span-6 lg:col-span-5",
              )}
            >
              <div className="self-start leading-none">
                <Logo
                  className="flex items-start opacity-95"
                  imageClassName={
                    compact
                      ? "h-9 w-[11.5rem] object-cover object-left sm:h-10 sm:w-[14rem]"
                      : "h-10 w-[12.5rem] object-cover object-left sm:h-12 sm:w-[16rem]"
                  }
                />
              </div>
            </div>

            <div
              className={cn(
                "flex min-w-0 flex-col",
                compact ? "gap-2.5" : "gap-3 sm:col-span-3 lg:col-span-3",
              )}
            >
              {PLATFORM_PATHS.map((item) => (
                <Link key={item.href} className={footerNavLinkClass} href={item.href}>
                  {tn(item.key)}
                </Link>
              ))}
            </div>

            <div
              className={cn(
                "flex min-w-0 flex-col",
                compact ? "gap-2.5" : "gap-3 sm:col-span-3 lg:col-span-4",
              )}
            >
              {LEGAL_PATHS.map((item) => (
                <Link key={item.href} className={footerNavLinkClass} href={item.href}>
                  {t(item.key)}
                </Link>
              ))}
            </div>
          </div>

          <Separator className={cn("bg-white/[0.08]", compact ? "my-6 sm:my-7" : "my-10")} />

          <div className="text-sm leading-relaxed text-white/50">
            © {new Date().getFullYear()} Kvalifits
          </div>
        </div>
      </Container>
    </footer>
  );
}
