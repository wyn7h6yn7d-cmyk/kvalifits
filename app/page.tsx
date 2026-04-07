import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { WhyKvalifits } from "@/components/sections/WhyKvalifits";
import { Audience } from "@/components/sections/Audience";
import { SmartMatching } from "@/components/sections/SmartMatching";
import { LoginAnchor } from "@/components/sections/LoginAnchor";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <div className="flex-1 bg-black">
      <Navbar />
      <main>
        <Hero />
        <WhyKvalifits />
        <Audience />
        <SmartMatching />
        <LoginAnchor />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
