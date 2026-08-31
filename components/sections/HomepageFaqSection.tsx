import { getTranslations } from "next-intl/server";

import { HomeFaqItem } from "@/components/sections/home/HomeFaqItem";
import { HomeSectionHeader } from "@/components/sections/home/HomeSectionHeader";
import { HomeSectionShell } from "@/components/sections/home/HomeSectionShell";

const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

export async function HomepageFaqSection() {
  const t = await getTranslations("homeFaq");

  const items = FAQ_KEYS.map((key) => ({
    question: t(`${key}Question`),
    answer: t(`${key}Answer`),
  }));

  return (
    <HomeSectionShell tone="base" glow="top" narrow aria-labelledby="home-faq-title">
      <HomeSectionHeader title={t("title")} id="home-faq-title" />
      <div className="relative flex flex-col gap-3 sm:gap-3.5">
        {items.map((item) => (
          <HomeFaqItem key={item.question} question={item.question} answer={item.answer} />
        ))}
      </div>
    </HomeSectionShell>
  );
}
