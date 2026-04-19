import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/routing";

const LEGAL_PATHS = [
  { href: "/privaatsus", key: "privacyPolicy" as const },
  { href: "/tingimused", key: "terms" as const },
  { href: "/kupsised", key: "cookies" as const },
  { href: "/andmekaitse", key: "dataRights" as const },
];

const footerNavLinkClass = "block text-[15px] leading-6 text-white/72 hover:text-white";

export async function Footer() {
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");

  return (
    <footer className="border-t border-white/[0.08] bg-black/30">
      <Container>
        <div className="py-12">
          <div className="grid grid-cols-1 items-start gap-x-0 gap-y-10 sm:grid-cols-6 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-0 xl:gap-x-10">
            <div className="flex min-w-0 flex-col gap-3 sm:col-span-6 lg:col-span-5">
              <div className="self-start leading-none">
                <Logo className="flex flex-col items-start gap-0 opacity-95" />
              </div>
              <div className="flex max-w-md flex-col gap-3">
                <p className="text-[15px] leading-7 text-white/70 sm:text-base">{t("tagline")}</p>
                <p className="text-sm leading-relaxed text-white/50">{t("legalNote")}</p>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-3 sm:col-span-3 lg:col-span-2">
              <div className="text-[13px] font-medium uppercase tracking-wide text-white/60">
                {t("platform")}
              </div>
              <div className="flex flex-col gap-3">
                <Link className={footerNavLinkClass} href="/tood">
                  {tn("jobs")}
                </Link>
                <Link className={footerNavLinkClass} href="/tooandjatele">
                  {tn("employers")}
                </Link>
                <Link className={footerNavLinkClass} href="/toootsijatele">
                  {tn("seekers")}
                </Link>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-3 sm:col-span-3 lg:col-span-2">
              <div className="text-[13px] font-medium uppercase tracking-wide text-white/60">
                {t("company")}
              </div>
              <div className="flex flex-col gap-3">
                <Link className={footerNavLinkClass} href="/ettevote">
                  {t("companyInfo")}
                </Link>
                <Link className={footerNavLinkClass} href="/kontakt">
                  {t("contact")}
                </Link>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-3 sm:col-span-6 lg:col-span-3">
              <div className="text-[13px] font-medium uppercase tracking-wide text-white/60">
                {t("legal")}
              </div>
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

          <div className="flex flex-col gap-3 text-sm leading-relaxed text-white/50 sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} Kvalifits</div>
            <div className="text-white/50">{t("copyright")}</div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
