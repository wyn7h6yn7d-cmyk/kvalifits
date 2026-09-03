import { getTranslations } from "next-intl/server";

import { HomeFaqItem } from "@/components/sections/home/HomeFaqItem";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"] as const;

/** Same left-aligned column for hero copy and FAQ cards. */
const FAQ_COL = "w-full max-w-5xl";

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
        innerClassName={cn("mx-0", FAQ_COL)}
        contentClassName="pb-8 sm:pb-10 lg:pb-12"
      />

      <section className="bg-background pb-14 sm:pb-16 lg:pb-20" aria-label={t("title")}>
        <Container>
          <div className={cn("mx-0 flex flex-col gap-4 lg:gap-5", FAQ_COL)}>
            {items.map((item) => (
              <HomeFaqItem key={item.question} question={item.question} answer={item.answer} />
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
