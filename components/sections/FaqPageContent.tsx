import { getTranslations } from "next-intl/server";

import { HomeFaqItem } from "@/components/sections/home/HomeFaqItem";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/container";

const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"] as const;

/** Standalone FAQ page body — shared copy lives in `homeFaq` messages. */
export async function FaqPageContent() {
  const t = await getTranslations("homeFaq");
  const tp = await getTranslations("pages.faq");

  const items = FAQ_KEYS.map((key) => ({
    question: t(`${key}Question`),
    answer: t(`${key}Answer`),
  }));

  return (
    <div className="bg-background">
      <PageHero
        eyebrow={tp("eyebrow")}
        title={t("title")}
        subtitle={tp("subtitle")}
        innerClassName="mx-0 w-full max-w-3xl"
        contentClassName="pb-8 sm:pb-10 lg:pb-12"
      />

      <section className="bg-background pb-14 sm:pb-16 lg:pb-20" aria-label={t("title")}>
        <Container>
          <div className="mx-0 flex w-full max-w-3xl flex-col gap-4 lg:gap-5">
            {items.map((item) => (
              <HomeFaqItem key={item.question} question={item.question} answer={item.answer} />
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
