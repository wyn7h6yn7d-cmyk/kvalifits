import Image from "next/image";

import type { ApprovedTestimonial } from "@/lib/testimonials/types";
import { SITE_BODY } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

export function TestimonialCard({
  testimonial,
  className,
}: {
  testimonial: ApprovedTestimonial;
  className?: string;
}) {
  const meta = [testimonial.role, testimonial.company].filter(Boolean).join(" · ");

  return (
    <article
      className={cn(
        "flex h-full min-w-0 flex-col gap-6 rounded-2xl border border-white/[0.08] bg-[#12121a]/90 p-6 sm:p-7 lg:p-8",
        className,
      )}
    >
      <blockquote className={cn("flex-1 text-pretty text-foreground", SITE_BODY, "text-[1.0625rem] sm:text-[1.125rem]")}>
        <p>“{testimonial.quote}”</p>
      </blockquote>

      <footer className="flex min-w-0 items-center gap-3.5">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/[0.10] bg-[#101018]">
          <Image
            src={testimonial.photoPath}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[0.9375rem] font-semibold text-foreground sm:text-base">
            {testimonial.firstName}
          </div>
          {meta ? (
            <div className="mt-0.5 truncate text-[0.8125rem] leading-snug text-muted-2 sm:text-[0.875rem]">
              {meta}
            </div>
          ) : null}
        </div>
      </footer>
    </article>
  );
}
