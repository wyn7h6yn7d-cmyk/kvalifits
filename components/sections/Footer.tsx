import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/routing";
import { SITE_BODY, SITE_EYEBROW } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

const PLATFORM_PATHS = [
  { href: "/tood", key: "jobs" as const },
  { href: "/toootsijatele", key: "forSeekers" as const },
  { href: "/tooandjatele", key: "forEmployers" as const },
  { href: "/ettevotted", key: "companies" as const },
] as const;

const LEGAL_PATHS = [
  { href: "/privaatsus", key: "privacyPolicy" as const },
  { href: "/tingimused", key: "terms" as const },
  { href: "/kupsised", key: "cookies" as const },
  { href: "/kontakt", key: "contact" as const, namespace: "nav" as const },
] as const;

const footerLinkClass =
  "inline-flex min-h-11 items-center text-[1rem] leading-snug text-body transition-colors duration-200 hover:text-foreground lg:text-[1.0625rem]";

type Props = {
  /** Tighter spacing/grid for the jobs listing experience. Layout only — no content changes. */
  compact?: boolean;
};

function FooterLinkColumn({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <h2 id={id} className={SITE_EYEBROW}>
        {title}
      </h2>
      <nav aria-labelledby={id} className="mt-4 flex flex-col gap-1 lg:mt-5">
        {children}
      </nav>
    </div>
  );
}

export async function Footer({ compact = false }: Props) {
  const tn = await getTranslations("nav");
  const t = await getTranslations("footer");

  return (
    <footer
      className={cn(
        "relative bg-background",
        compact && "-mt-4 sm:-mt-5 lg:-mt-6",
      )}
    >

      <Container>
        <div className={cn("relative", compact ? "py-9 sm:py-10" : "py-12 lg:py-14")}>
          <div
            className={cn(
              "grid grid-cols-1 items-start",
              compact
                ? "gap-y-10 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] sm:gap-x-10 lg:gap-x-12"
                : "gap-y-11 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-14 xl:gap-x-16",
            )}
          >
            <div
              className={cn(
                "flex min-w-0 flex-col gap-5",
                !compact && "sm:col-span-2 lg:col-span-1",
              )}
            >
              <Logo
                className="self-start"
                imageClassName={
                  compact
                    ? "h-9 w-auto sm:h-10 lg:h-11"
                    : "h-9 w-auto sm:h-10 lg:h-[3.75rem] xl:h-[4rem]"
                }
              />
              <p className={cn("max-w-[22rem] text-pretty", SITE_BODY, "text-muted")}>{t("tagline")}</p>
            </div>

            <FooterLinkColumn id="footer-platform" title={t("platformTitle")}>
              {PLATFORM_PATHS.map((item) => (
                <Link key={item.href} className={footerLinkClass} href={item.href}>
                  {tn(item.key)}
                </Link>
              ))}
            </FooterLinkColumn>

            <FooterLinkColumn id="footer-legal" title={t("legalTitle")}>
              {LEGAL_PATHS.map((item) => (
                <Link key={item.href} className={footerLinkClass} href={item.href}>
                  {"namespace" in item && item.namespace === "nav" ? tn(item.key) : t(item.key)}
                </Link>
              ))}
            </FooterLinkColumn>
          </div>

          <Separator className={cn("bg-white/[0.07]", compact ? "my-7 sm:my-8" : "my-8 sm:my-9")} />

          <p className="text-[0.9375rem] leading-snug text-muted-2 lg:text-base">
            © {new Date().getFullYear()} Kvalifits
          </p>
        </div>
      </Container>
    </footer>
  );
}
