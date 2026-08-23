import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";
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

export async function Footer() {
  const tn = await getTranslations("nav");
  const t = await getTranslations("footer");

  return (
    <footer className="border-t border-white/[0.06] bg-surface">
      <Container>
        <div className="py-12">
          <div className="grid grid-cols-1 items-start gap-x-0 gap-y-10 sm:grid-cols-6 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-0 xl:gap-x-10">
            <div className="flex min-w-0 flex-col gap-3 sm:col-span-6 lg:col-span-5">
              <div className="self-start leading-none">
                <Logo
                  className="flex items-start opacity-95"
                  imageClassName="h-10 w-[12.5rem] object-cover object-left sm:h-12 sm:w-[16rem]"
                />
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-3 sm:col-span-3 lg:col-span-3">
              <div className="flex flex-col gap-3">
                {PLATFORM_PATHS.map((item) => (
                  <Link key={item.href} className={footerNavLinkClass} href={item.href}>
                    {tn(item.key)}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-3 sm:col-span-3 lg:col-span-4">
              <div className="flex flex-col gap-3">
                {LEGAL_PATHS.map((item) => (
                  <Link key={item.href} className={footerNavLinkClass} href={item.href}>
                    {t(item.key)}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Separator className="my-10 bg-white/[0.08]" />

          <div className="text-sm leading-relaxed text-white/50">
            © {new Date().getFullYear()} Kvalifits
          </div>
        </div>
      </Container>
    </footer>
  );
}
