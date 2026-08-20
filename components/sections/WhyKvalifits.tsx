import { getTranslations } from "next-intl/server";
import { Fingerprint, Landmark, ShieldCheck } from "lucide-react";

import { Container } from "@/components/ui/container";

const ICONS = [Fingerprint, ShieldCheck, Landmark] as const;

export async function WhyKvalifits() {
  const t = await getTranslations("why");

  const blocks = [
    { icon: ICONS[0], title: t("b1Title"), desc: t("b1Desc") },
    { icon: ICONS[1], title: t("b2Title"), desc: t("b2Desc") },
    { icon: ICONS[2], title: t("b3Title"), desc: t("b3Desc") },
  ] as const;

  return (
    <section id="miks" className="relative scroll-mt-24 overflow-hidden bg-surface py-12 sm:py-16 lg:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_10%_0%,rgba(255,255,255,0.03),transparent_55%)]"
      />

      <Container className="relative z-10">
        <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-xl lg:text-left">
          <div className="text-[13px] font-medium uppercase tracking-wide text-muted-2 sm:text-sm">
            {t("eyebrow")}
          </div>
          <h2 className="mt-3 text-balance text-2xl font-semibold leading-tight tracking-tight text-foreground sm:mt-4 sm:text-3xl lg:text-[2.65rem]">
            {t("title")}
            {t("titleMuted").trim() ? (
              <span className="block text-muted-2"> {t("titleMuted")}</span>
            ) : null}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-body sm:mt-4 sm:text-lg sm:leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-8 max-w-4xl space-y-0 lg:mt-12">
          {blocks.map((b, idx) => (
            <div
              key={b.title}
              className="kf-enter group grid gap-3 border-t border-white/[0.04] py-5 first:border-t-0 first:pt-0 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-6 sm:py-7"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="flex h-10 w-10 items-center justify-center text-muted">
                <b.icon className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <div className="min-w-0 max-w-xl">
                <h3 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  {b.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-body sm:text-base sm:leading-relaxed">
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
