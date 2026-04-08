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

export async function Footer() {
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");

  return (
    <footer className="border-t border-white/[0.08] bg-black/30">
      <Container>
        <div className="py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-4">
              <Logo className="opacity-95" />
              <p className="mt-4 max-w-md text-sm leading-6 text-white/65">{t("tagline")}</p>
              <p className="mt-4 text-xs leading-relaxed text-white/40">{t("legalNote")}</p>
            </div>

            <div className="space-y-3 text-sm lg:col-span-2">
              <div className="text-xs font-medium tracking-[0.22em] uppercase text-white/55">
                {t("platform")}
              </div>
              <Link className="block text-white/70 hover:text-white" href="/tood">
                {tn("jobs")}
              </Link>
              <Link className="block text-white/70 hover:text-white" href="/tooandjatele">
                {tn("employers")}
              </Link>
              <Link className="block text-white/70 hover:text-white" href="/toootsijatele">
                {tn("seekers")}
              </Link>
            </div>

            <div className="space-y-3 text-sm lg:col-span-3">
              <div className="text-xs font-medium tracking-[0.22em] uppercase text-white/55">
                {t("company")}
              </div>
              <Link className="block text-white/70 hover:text-white" href="/ettevote">
                {t("companyInfo")}
              </Link>
              <Link className="block text-white/70 hover:text-white" href="/kontakt">
                {t("contact")}
              </Link>
            </div>

            <div className="space-y-3 text-sm lg:col-span-3">
              <div className="text-xs font-medium tracking-[0.22em] uppercase text-white/55">
                {t("legal")}
              </div>
              {LEGAL_PATHS.map((item) => (
                <Link
                  key={item.href}
                  className="block text-white/70 hover:text-white"
                  href={item.href}
                >
                  {t(item.key)}
                </Link>
              ))}
            </div>
          </div>

          <Separator className="my-10 bg-white/[0.08]" />

          <div className="flex flex-col gap-3 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} Kvalifits</div>
            <div className="text-white/45">{t("copyright")}</div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
