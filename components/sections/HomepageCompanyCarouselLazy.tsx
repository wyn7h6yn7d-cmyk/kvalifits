"use client";

import dynamic from "next/dynamic";

import type { HomepageShowcaseCompany } from "@/lib/companies/homepageShowcase";

const Carousel = dynamic(
  () =>
    import("@/components/sections/HomepageCompanyCarousel").then((m) => m.HomepageCompanyCarousel),
  {
    ssr: false,
    loading: () => (
      <div
        className="mx-auto h-[3.25rem] w-full max-w-5xl animate-pulse rounded-lg bg-white/[0.04] sm:h-14"
        aria-hidden
      />
    ),
  },
);

export function HomepageCompanyCarouselLazy({
  companies,
  logoAlt,
}: {
  companies: HomepageShowcaseCompany[];
  logoAlt: (name: string) => string;
}) {
  return <Carousel companies={companies} logoAlt={logoAlt} />;
}
