import { getTranslations } from "next-intl/server";

import { Container } from "@/components/ui/container";
import { SITE_BODY, SITE_H2_SECTION, SITE_H3 } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

export async function HomepageBenefitsSection() {
  const t = await getTranslations("homeBenefits");

  const blocks = [
    { n: "1", title: t("b1Title"), desc: t("b1Desc") },
    { n: "2", title: t("b2Title"), desc: t("b2Desc") },
    { n: "3", title: t("b3Title"), desc: t("b3Desc") },
  ] as const;

  return (
    <section className="bg-background py-10 sm:py-14 lg:py-16">
      <Container>
        <h2 className={SITE_H2_SECTION}>{t("title")}</h2>
        <ul className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-4 lg:gap-6">
          {blocks.map((b) => (
            <li key={b.n} className="min-w-0">
              <div className="text-[0.9375rem] font-medium tabular-nums text-muted">{b.n}</div>
              <h3 className={cn("mt-2", SITE_H3)}>{b.title}</h3>
              <p className={cn("mt-2 text-pretty", SITE_BODY, "text-muted")}>{b.desc}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
