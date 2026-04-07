import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/container";

export const metadata = {
  title: "Tööotsijatele",
};

export default function ToootsijatelePage() {
  return (
    <div className="flex-1 bg-black">
      <Navbar />
      <main>
        <PageHero
          eyebrow="Tööotsijatele"
          title="Sinu oskused on väärtus — tee need nähtavaks."
          subtitle="Kvalifits aitab sul esitleda kogemust ja sertifikaate nii, et sobivad tööd leiaksid sind kiiremini. Siia tuleb profiili ja sertifikaatide vaade."
        />
        <section className="py-16 sm:py-20">
          <Container>
            <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-8">
              <div className="text-sm font-medium text-white/85">Järgmised sammud</div>
              <div className="mt-3 text-sm leading-6 text-white/65">
                Profiil, oskuste lisamine, sertifikaatide üleslaadimine ja sobitused
                tulevad siia samasse stiili — puhtalt, premium’ilt ja selgelt.
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}

