import dynamic from "next/dynamic";

import { SectionDivider } from "@/components/site/SectionDivider";
import { BelowFoldSectionSkeleton } from "@/components/site/BelowFoldSectionSkeleton";
import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { LoginAnchor } from "@/components/sections/LoginAnchor";
import { Footer } from "@/components/sections/Footer";

const sectionLoading = () => <BelowFoldSectionSkeleton />;

const WhyKvalifits = dynamic(
  () => import("@/components/sections/WhyKvalifits").then((m) => ({ default: m.WhyKvalifits })),
  { loading: sectionLoading },
);

const Audience = dynamic(
  () => import("@/components/sections/Audience").then((m) => ({ default: m.Audience })),
  { loading: sectionLoading },
);

const FinalCTA = dynamic(
  () => import("@/components/sections/FinalCTA").then((m) => ({ default: m.FinalCTA })),
  { loading: sectionLoading },
);

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  await params;

  return (
    <div className="relative flex-1 bg-background">
      <Navbar />
      <main className="relative z-0">
        <Hero />
        <SectionDivider />
        <WhyKvalifits />
        <Audience />
        <SectionDivider />
        <LoginAnchor />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
