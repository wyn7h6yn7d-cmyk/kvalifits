import { getTranslations } from "next-intl/server";
import { Fingerprint, Landmark, ShieldCheck } from "lucide-react";

import { Container } from "@/components/ui/container";
import { SITE_GRID_GAP, SITE_H2_SECTION } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

const ICONS = [Fingerprint, ShieldCheck, Landmark] as const;

export async function HomepageBenefitsSection() {
  const t = await getTranslations("homeBenefits");

  const blocks = [
    { icon: ICONS[0], title: t("b1Title"), desc: t("b1Desc") },
    { icon: ICONS[1], title: t("b2Title"), desc: t("b2Desc") },
    { icon: ICONS[2], title: t("b3Title"), desc: t("b3Desc") },
  ] as const;

  return (
    <section className="bg-surface py-8 sm:py-10 lg:py-12">
      <Container>
        <h2 className={SITE_H2_SECTION}>{t("title")}</h2>
        <ul className={cn("mt-6 grid sm:grid-cols-3", SITE_GRID_GAP)}>
          {blocks.map((b) => (
            <li key={b.title} className="min-w-0">
              <div className="flex h-10 w-10 items-center justify-center text-white/55">
                <b.icon className="h-5 w-5" strokeWidth={1.6} aria-hidden />
              </div>
              <h3 className="mt-3 text-[15px] font-semibold tracking-tight text-white">{b.title}</h3>
              <p className="mt-2 text-pretty text-[14px] leading-relaxed text-white/62">{b.desc}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
