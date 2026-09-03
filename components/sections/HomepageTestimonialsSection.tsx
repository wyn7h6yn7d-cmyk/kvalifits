import { getTranslations } from "next-intl/server";

import { HomeSectionHeader } from "@/components/sections/home/HomeSectionHeader";
import { HomeSectionShell } from "@/components/sections/home/HomeSectionShell";
import { TestimonialCard } from "@/components/site/TestimonialCard";
import { getApprovedTestimonialsForLocale } from "@/lib/testimonials/loadApprovedTestimonials";

/**
 * Success stories — renders only when feature is on and approved testimonials exist.
 * Never invents quotes or names; empty catalog ⇒ section omitted in production.
 */
export async function HomepageTestimonialsSection({ locale }: { locale: string }) {
  const testimonials = getApprovedTestimonialsForLocale(locale);
  if (!testimonials.length) return null;

  const t = await getTranslations({ locale, namespace: "homeTestimonials" });

  return (
    <HomeSectionShell tone="base" aria-labelledby="home-testimonials-title">
      <HomeSectionHeader title={t("title")} id="home-testimonials-title" lead={t("lead")} />
      <ul
        className={
          testimonials.length === 1
            ? "mx-auto grid max-w-xl list-none"
            : "grid list-none gap-5 sm:grid-cols-2 lg:gap-7"
        }
      >
        {testimonials.map((item) => (
          <li key={item.id} className="min-w-0">
            <TestimonialCard testimonial={item} />
          </li>
        ))}
      </ul>
    </HomeSectionShell>
  );
}
