import { SectionDivider } from "@/components/site/SectionDivider";
import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { WhyKvalifits } from "@/components/sections/WhyKvalifits";
import { Audience } from "@/components/sections/Audience";
import { SmartMatching } from "@/components/sections/SmartMatching";
import { LoginAnchor } from "@/components/sections/LoginAnchor";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";

export default function HomePage() {
  return (
    <div className="relative flex-1 bg-background">
      <Navbar />
      <main className="relative z-0">
        <Hero />
        <SectionDivider />
        <SmartMatching />
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
