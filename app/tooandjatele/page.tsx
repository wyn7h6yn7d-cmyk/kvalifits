import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/container";

export const metadata = {
  title: "Tööandjatele",
};

export default function TooandjatelePage() {
  return (
    <div className="flex-1 bg-black">
      <Navbar />
      <main>
        <PageHero
          eyebrow="Tööandjatele"
          title="Värba kindlamalt — pädevus on nähtav."
          subtitle="Kvalifits toob sinuni kandidaadid, kelle oskused ja sertifikaadid on kontrollitavad. Siia tuleb tööpakkumise lisamise ja kandidaatide vaade."
        />
        <section className="py-16 sm:py-20">
          <Container>
            <div className="grid gap-6 lg:grid-cols-3">
              {[
                {
                  title: "Nõuded, mis loevad",
                  desc: "Määra oskused ja sertifikaadid, mitte ainult märksõnad.",
                },
                {
                  title: "Kvaliteetsemad sobitused",
                  desc: "Näed kohe, mis on kontrollitud ja kui hästi see sobib.",
                },
                {
                  title: "Usaldus ajas",
                  desc: "Tagasiside ja verifitseerimine parandavad kvaliteeti järjepidevalt.",
                },
              ].map((x) => (
                <div
                  key={x.title}
                  className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-7"
                >
                  <div className="text-sm font-medium text-white/85">{x.title}</div>
                  <div className="mt-3 text-sm leading-6 text-white/65">{x.desc}</div>
                </div>
              ))}
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}

