import { getTranslations } from "next-intl/server";
import { Fingerprint, Landmark, ShieldCheck } from "lucide-react";

import { Container } from "@/components/ui/container";
import { SITE_BODY, SITE_EYEBROW, SITE_H2_SECTION, SITE_H3 } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

const ICONS = [Fingerprint, ShieldCheck, Landmark] as const;

export async function WhyKvalifits() {
  const t = await getTranslations("why");

  const blocks = [
    { icon: ICONS[0], title: t("b1Title"), desc: t("b1Desc") },
    { icon: ICONS[1], title: t("b2Title"), desc: t("b2Desc") },
    { icon: ICONS[2], title: t("b3Title"), desc: t("b3Desc") },
  ] as const;

  return (
    <section id="miks" className="relative scroll-mt-24 overflow-hidden bg-surface py-10 sm:py-14 lg:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_10%_0%,rgba(255,255,255,0.03),transparent_55%)]"
      />

      <Container className="relative z-10">
        <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-xl lg:text-left">
          <div className={SITE_EYEBROW}>
            {t("eyebrow")}
          </div>
          <h2 className={cn("mt-3 sm:mt-4", SITE_H2_SECTION)}>
            {t("title")}
            {t("titleMuted").trim() ? (
              <span className="block font-medium text-muted"> {t("titleMuted")}</span>
            ) : null}
          </h2>
          <p className={cn("mt-3 text-pretty sm:mt-4", SITE_BODY)}>
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-6 max-w-4xl space-y-6 sm:mt-8 sm:space-y-8 lg:mt-12">
          {blocks.map((b, idx) => (
            <div
              key={b.title}
              className="kf-enter group grid gap-3 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-6"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="flex h-10 w-10 items-center justify-center text-muted">
                <b.icon className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <div className="min-w-0 max-w-xl">
                <h3 className={SITE_H3}>
                  {b.title}
                </h3>
                <p className={cn("mt-2 text-pretty", SITE_BODY)}>
                  {b.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
