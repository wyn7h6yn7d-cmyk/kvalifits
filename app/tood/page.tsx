import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { PageHero } from "@/components/site/PageHero";
import { JobsSearch } from "@/components/jobs/JobsSearch";
import { MOCK_JOBS } from "@/components/jobs/mock-data";

export const metadata = {
  title: "Tööd",
};

export default function ToodPage() {
  return (
    <div className="flex-1 bg-black">
      <Navbar />
      <main>
        <PageHero
          eyebrow="Tööd"
          title="Leia töö, mis sobib sinu päris oskustega."
          subtitle="Filtreeri sertifikaatide, kvalifikatsioonide ja kogemuse järgi — ning näe sobivust selgelt, ilma müra ja oletusteta."
        />
        <JobsSearch jobs={MOCK_JOBS} />
      </main>
      <Footer />
    </div>
  );
}

