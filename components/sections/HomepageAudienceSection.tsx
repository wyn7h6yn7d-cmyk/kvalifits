import { getTranslations } from "next-intl/server";
import { ArrowUpRight, Briefcase, UserRound } from "lucide-react";

import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/routing";
import { SITE_GRID_GAP, SITE_H2_SECTION } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

export async function HomepageAudienceSection() {
  const t = await getTranslations("homeAudience");

  const cards = [
    {
      icon: UserRound,
      title: t("seekerTitle"),
      desc: t("seekerDesc"),
      href: "/toootsijatele",
      link: t("seekerLink"),
    },
    {
      icon: Briefcase,
      title: t("employerTitle"),
      desc: t("employerDesc"),
      href: "/tooandjatele",
      link: t("employerLink"),
    },
  ] as const;

  return (
    <section className="border-t border-white/[0.06] bg-surface py-10 sm:py-12 lg:py-14">
      <Container>
        <h2 className={SITE_H2_SECTION}>{t("title")}</h2>
        <div className={cn("mt-6 grid lg:grid-cols-2", SITE_GRID_GAP)}>
          {cards.map((card) => (
            <div
              key={card.href}
              className="min-w-0 rounded-2xl border border-white/[0.08] bg-[#16161b] p-4 sm:p-5 lg:p-6"
            >
              <div className="flex items-center gap-2.5">
                <card.icon className="h-5 w-5 shrink-0 text-white/55" strokeWidth={1.6} aria-hidden />
                <h3 className="text-[15px] font-semibold tracking-tight text-white">{card.title}</h3>
              </div>
              <p className="mt-2 text-pretty text-[14px] leading-relaxed text-white/62">{card.desc}</p>
              <Link
                href={card.href}
                className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-white/78 hover:text-white"
              >
                {card.link}
                <ArrowUpRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              </Link>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
