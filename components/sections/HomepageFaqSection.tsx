import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/ui/container";
import { SITE_BODY, SITE_H2_SECTION, SITE_H3 } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"] as const;

export async function HomepageFaqSection() {
  const t = await getTranslations("homeFaq");

  const items = FAQ_KEYS.map((key) => ({
    question: t(`${key}Question`),
    answer: t(`${key}Answer`),
  }));

  return (
    <section className="bg-background py-10 sm:py-12" aria-labelledby="home-faq-title">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h2 id="home-faq-title" className={SITE_H2_SECTION}>
            {t("title")}
          </h2>
          <div className="mt-8 divide-y divide-border border-y border-border">
            {items.map((item) => (
              <details key={item.question} className="group py-1">
                <summary
                  className={cn(
                    SITE_H3,
                    "flex min-w-0 cursor-pointer list-none items-start justify-between gap-3 py-4 text-pretty marker:content-none [&::-webkit-details-marker]:hidden",
                    "rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
                  )}
                >
                  <span className="min-w-0 flex-1">{item.question}</span>
                  <ChevronDown
                    className="mt-0.5 h-5 w-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className={cn("pb-4 pr-9 text-pretty", SITE_BODY, "text-muted")}>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
