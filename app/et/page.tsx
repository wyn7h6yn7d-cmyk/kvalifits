import Link from "next/link";

function Badge({
  children,
  variant = "subtle",
}: {
  children: React.ReactNode;
  variant?: "subtle" | "brand";
}) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-[13px] leading-none font-medium tracking-tight ring-1 ring-inset";
  const styles =
    variant === "brand"
      ? "bg-violet-500/15 text-violet-100 ring-violet-400/30"
      : "bg-white/6 text-white/85 ring-white/12";
  return <span className={`${base} ${styles}`}>{children}</span>;
}

function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full bg-violet-500 px-5 py-3 text-[15px] font-semibold tracking-tight text-white shadow-[0_10px_30px_-14px_rgba(139,92,246,0.9)] ring-1 ring-inset ring-white/10 transition hover:bg-violet-400 focus-visible:outline-none"
    >
      {children}
    </Link>
  );
}

function SecondaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full bg-white/6 px-5 py-3 text-[15px] font-semibold tracking-tight text-white/90 ring-1 ring-inset ring-white/12 transition hover:bg-white/10 hover:ring-white/18 focus-visible:outline-none"
    >
      {children}
    </Link>
  );
}

function Section({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section id={id} className="py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          {eyebrow ? (
            <div className="mb-3">
              <span className="inline-flex items-center rounded-full bg-white/6 px-3 py-1 text-[13px] font-semibold tracking-wide text-white/80 ring-1 ring-inset ring-white/12">
                {eyebrow}
              </span>
            </div>
          ) : null}
          <h2 className="text-balance text-[clamp(26px,3.2vw,36px)] font-semibold leading-[1.12] tracking-[-0.03em] text-white">
            {title}
          </h2>
          {description ? (
            <p className="mt-4 text-pretty text-[16px] leading-[1.65] text-white/72 sm:text-[17px]">
              {description}
            </p>
          ) : null}
        </div>
        {children ? <div className="mt-10">{children}</div> : null}
      </div>
    </section>
  );
}

export default function EstonianLanding() {
  return (
    <div className="min-h-full bg-black text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-48 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -bottom-64 right-[-180px] h-[520px] w-[520px] rounded-full bg-fuchsia-600/10 blur-3xl" />
      </div>

      <header className="relative">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/et"
            className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-[14px] font-semibold tracking-tight text-white/90 ring-1 ring-inset ring-white/10 transition hover:bg-white/7 hover:ring-white/15 focus-visible:outline-none"
          >
            <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_0_4px_rgba(167,139,250,0.18)]" />
            kvalifits.ee
          </Link>

          <div className="hidden items-center gap-6 text-[14px] font-semibold tracking-tight text-white/75 md:flex">
            <a
              className="transition hover:text-white focus-visible:outline-none"
              href="#kuidas-tootab"
            >
              Kuidas töötab
            </a>
            <a
              className="transition hover:text-white focus-visible:outline-none"
              href="#tookandjatele"
            >
              Tööandjatele
            </a>
            <a
              className="transition hover:text-white focus-visible:outline-none"
              href="#kkk"
            >
              KKK
            </a>
          </div>

          <div className="flex items-center gap-3">
            <SecondaryButton href="#tookandjatele">Vaata pakkumist</SecondaryButton>
            <div className="hidden sm:block">
              <PrimaryButton href="#alusta">Alusta</PrimaryButton>
            </div>
          </div>
        </nav>
      </header>

      <main className="relative">
        <section className="pt-10 pb-16 sm:pt-14 sm:pb-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
              <div className="pt-4 sm:pt-8">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="brand">Reaalajas sobitus</Badge>
                  <Badge>Usaldusväärne kontroll</Badge>
                  <Badge>Premium kogemus</Badge>
                </div>

                <h1 className="mt-6 text-balance text-[clamp(30px,4.2vw,56px)] font-semibold leading-[1.08] tracking-[-0.04em] text-white">
                  Leia sobiv inimene kiiremini – ja hoia kvaliteet kontrolli all.
                </h1>

                <p className="mt-5 max-w-xl text-pretty text-[16px] leading-[1.65] text-white/74 sm:text-[18px]">
                  Kvalifits ühendab sobituse, värsked kandidaadid ja
                  kvalifikatsioonikontrolli ühte selgesse töövoogu. Tulemuseks on
                  vähem müra ja rohkem kindlust.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <PrimaryButton href="#alusta">Alusta sobitusega</PrimaryButton>
                  <SecondaryButton href="#kuidas-tootab">
                    Vaata, kuidas toimib
                  </SecondaryButton>
                </div>

                <div className="mt-8 flex flex-wrap gap-4 text-[14px] leading-[1.55] text-white/70">
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-inset ring-white/10">
                    <span className="text-white/85">Värske:</span>
                    <span className="font-semibold text-white">tööotsija</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-inset ring-white/10">
                    <span className="text-white/85">Tööandja:</span>
                    <span className="font-semibold text-white">
                      sertifikaat kontrollitud
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:pt-10">
                <div className="rounded-3xl bg-gradient-to-b from-white/8 to-white/3 p-[1px] shadow-[0_40px_90px_-70px_rgba(167,139,250,0.9)]">
                  <div className="rounded-3xl bg-black/70 p-5 ring-1 ring-inset ring-white/10 backdrop-blur-sm sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="brand">Sobitus</Badge>
                          <Badge>Reaalajas</Badge>
                          <Badge>Värske</Badge>
                        </div>
                        <div className="mt-4 min-w-0">
                          <div className="text-[13px] font-semibold tracking-wide text-white/60">
                            Kandidaat
                          </div>
                          <div className="mt-1 text-[18px] font-semibold leading-[1.2] tracking-[-0.02em] text-white">
                            Elektrik
                            <span className="text-white/70">
                              {" "}
                              · A‑pädevus
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 min-w-0">
                          <div className="text-[13px] font-semibold tracking-wide text-white/60">
                            Töökoht
                          </div>
                          <div className="mt-1 text-pretty text-[16px] font-semibold leading-[1.3] tracking-[-0.02em] text-white">
                            Hooldus- ja paigaldustööde elektrik (tööstus)
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <div className="rounded-2xl bg-white/6 px-4 py-3 text-center ring-1 ring-inset ring-white/12">
                          <div className="text-[12px] font-semibold tracking-wide text-white/65">
                            Sobivus
                          </div>
                          <div className="mt-1 text-[28px] font-semibold leading-[1.05] tracking-[-0.03em] text-white">
                            87%
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-inset ring-white/10">
                        <div className="text-[12px] font-semibold tracking-wide text-white/60">
                          Staatus
                        </div>
                        <div className="mt-1 text-[14px] font-semibold leading-[1.35] text-white/90">
                          Tööotsija · värske
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-inset ring-white/10">
                        <div className="text-[12px] font-semibold tracking-wide text-white/60">
                          Tööandja
                        </div>
                        <div className="mt-1 text-[14px] font-semibold leading-[1.35] text-white/90">
                          Sertifikaat kontrollitud
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl bg-white/5 px-4 py-4 ring-1 ring-inset ring-white/10">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[13px] font-semibold tracking-wide text-white/70">
                          Nõuded
                        </div>
                        <div className="text-[13px] font-semibold text-white/85">
                          8 / 10
                        </div>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white/8 ring-1 ring-inset ring-white/10">
                        <div className="h-2 w-[80%] rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_10px_30px_-18px_rgba(167,139,250,0.9)]" />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge>Ohutus</Badge>
                        <Badge>Dokumendid</Badge>
                        <Badge>Kogemus</Badge>
                        <Badge>Ajagraafik</Badge>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-[14px] leading-[1.55] text-white/72">
                        Metadata:{" "}
                        <span className="font-semibold text-white/90">
                          Elektrik · A‑pädevus · Sobivus 87%
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <SecondaryButton href="#kuidas-tootab">
                          Vaata detaile
                        </SecondaryButton>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-[14px] leading-[1.6] text-white/60">
                  Kaart on ehitatud nii, et pikemad ametinimetused ja kirjeldused
                  wrap’ivad loogiliselt ning mobile’is on sisu selgelt
                  loetav.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Section
          id="kuidas-tootab"
          eyebrow="Kuidas töötab"
          title="Selge hierarhia. Vähem bluri. Rohkem kindlust."
          description="Typography, kontrast ja spacing on seatud nii, et dark/gradient taustal jääks kõik loetav – badge’id, sekundaarne tekst, progress ja CTA-d."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Sobitus",
                desc: "Reaalajas sobivuse signaalid ja nõuete täitmine ühes vaates.",
              },
              {
                title: "Kontroll",
                desc: "Sertifikaatide ja oluliste signaalide selge, kõrge kontrastiga kuvamine.",
              },
              {
                title: "Töövoog",
                desc: "CTA-d on nähtavad, kuid mitte agressiivsed; focus/hover on premium ja a11y-friendly.",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-3xl bg-gradient-to-b from-white/8 to-white/3 p-[1px]"
              >
                <div className="h-full rounded-3xl bg-black/60 p-6 ring-1 ring-inset ring-white/10 backdrop-blur-sm">
                  <div className="text-[18px] font-semibold leading-[1.2] tracking-[-0.02em] text-white">
                    {c.title}
                  </div>
                  <p className="mt-3 text-[15px] leading-[1.65] text-white/72">
                    {c.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="tookandjatele"
          eyebrow="Tööandjatele"
          title="Lihtne hinnastus. Selge väärtus."
          description="Üks pakkumine, üks eesmärk: kiiremini paremad kandidaadid – usaldusväärsete signaalidega."
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
            <div className="rounded-3xl bg-gradient-to-b from-white/10 to-white/4 p-[1px]">
              <div className="rounded-3xl bg-black/65 p-6 ring-1 ring-inset ring-white/12 backdrop-blur-sm sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-[16px] font-semibold tracking-tight text-white">
                      1 töökuulutus
                    </div>
                    <p className="mt-2 text-[15px] leading-[1.65] text-white/72">
                      Premium nähtavus ja sobitus-signaalid 30 päeva.
                    </p>
                  </div>
                  <Badge variant="brand">Launch ready</Badge>
                </div>

                <div className="mt-6 rounded-2xl bg-white/6 p-5 ring-1 ring-inset ring-white/12">
                  <div className="text-[13px] font-semibold tracking-wide text-white/65">
                    Hinnastus
                  </div>
                  <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                    <div className="text-[18px] font-semibold leading-[1.2] tracking-[-0.02em] text-white/90">
                      30 päeva
                    </div>
                    <div className="text-[32px] font-semibold leading-[1.05] tracking-[-0.04em] text-white">
                      99 €
                    </div>
                  </div>
                  <div className="mt-3 text-[14px] leading-[1.55] text-white/65">
                    Selgelt kuvatud hinnaplokk, mis töötab ka mobiilis.
                  </div>
                </div>

                <ul className="mt-6 grid gap-3 text-[14px] leading-[1.6] text-white/74">
                  {[
                    "Kandidaadi sobivuse signaalid ja nõuete täitmine",
                    "Sertifikaadi / kvalifikatsiooni usaldussignaal",
                    "Selged CTA-d ja premium UX (hover/focus/active)",
                  ].map((t) => (
                    <li key={t} className="flex gap-3">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400/80" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <PrimaryButton href="#alusta">Alusta töökuulutusega</PrimaryButton>
                  <SecondaryButton href="#kkk">Küsi lisaks</SecondaryButton>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-inset ring-white/10 sm:p-7">
              <div className="text-[16px] font-semibold tracking-tight text-white">
                Miks see töötab
              </div>
              <div className="mt-4 grid gap-4">
                {[
                  {
                    k: "Loetavus",
                    v: "Body ≥ 16px, small helper ≥ 14px, kõrgem kontrast sekundaarsele tekstile.",
                  },
                  {
                    k: "Hierarhia",
                    v: "Headingud eristuvad selgelt (line-height ~1.1, tracking fine-tuned).",
                  },
                  {
                    k: "Mobiil",
                    v: "Cardid ei ole cramped; wrap + stack loogika hoiab sisu puhta.",
                  },
                ].map((r) => (
                  <div
                    key={r.k}
                    className="rounded-2xl bg-black/40 px-5 py-4 ring-1 ring-inset ring-white/10"
                  >
                    <div className="text-[13px] font-semibold tracking-wide text-white/60">
                      {r.k}
                    </div>
                    <div className="mt-2 text-[15px] leading-[1.65] text-white/76">
                      {r.v}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="kkk"
          eyebrow="KKK"
          title="Detailid, mis teevad vahe."
          description="Focus-visible ring on alati nähtav; CTA-d on selged; ja info ei ole ainult värviga edastatud."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                q: "Kas badge’id ja väiksed labelid on loetavad?",
                a: "Jah. Min 13–14px, kõrgem kontrast ning ring/border eristab neid tumedal taustal.",
              },
              {
                q: "Kas glow vähendab loetavust?",
                a: "Glow on hoitud “outside” ja kontrollitud opacity/blur’iga, et tekst ei upuks.",
              },
              {
                q: "Kas hero kaart laguneb pikema tekstiga?",
                a: "Ei. Layout kasutab wrap’i, min-width 0, ja mobile’is loogilist stacking’ut.",
              },
              {
                q: "Kas hinnastus on selgelt nähtav?",
                a: "Jah. “30 päeva – 99 €” on terviklik hinnaplokk koos pealkirja ja CTA-ga.",
              },
            ].map((i) => (
              <details
                key={i.q}
                className="group rounded-3xl bg-white/5 p-6 ring-1 ring-inset ring-white/10 transition hover:bg-white/7"
              >
                <summary className="cursor-pointer list-none text-[15px] font-semibold leading-[1.45] tracking-tight text-white/90 focus-visible:outline-none">
                  <span className="inline-flex items-start gap-3">
                    <span className="mt-[6px] h-2 w-2 rounded-full bg-violet-400/80 shadow-[0_0_0_4px_rgba(167,139,250,0.14)]" />
                    <span>{i.q}</span>
                  </span>
                </summary>
                <p className="mt-4 text-[15px] leading-[1.65] text-white/72">
                  {i.a}
                </p>
              </details>
            ))}
          </div>
        </Section>

        <section id="alusta" className="pb-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-gradient-to-r from-violet-500/18 via-fuchsia-500/10 to-white/6 p-[1px]">
              <div className="rounded-3xl bg-black/70 px-6 py-8 ring-1 ring-inset ring-white/10 backdrop-blur-sm sm:px-10 sm:py-10">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="max-w-2xl">
                    <div className="text-[13px] font-semibold tracking-wide text-white/65">
                      Ready to launch
                    </div>
                    <div className="mt-2 text-balance text-[clamp(20px,2.4vw,28px)] font-semibold leading-[1.2] tracking-[-0.03em] text-white">
                      Premium, loetav ja mobiilis tugev – viimane lihv enne launchi.
                    </div>
                    <div className="mt-3 text-[15px] leading-[1.65] text-white/72">
                      Kui soovid, saan järgmise sammuna teha `/` → `/et` automaatse
                      suunamise ja lisada tegelikud tekstid/sektsioonid sinu olemasolevast
                      sisust.
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <PrimaryButton href="#tookandjatele">Vaata hinnastust</PrimaryButton>
                    <SecondaryButton href="#kuidas-tootab">Vaata demo UI-d</SecondaryButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 text-[14px] text-white/65 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="font-semibold tracking-tight text-white/80">
            Kvalifits
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <a className="hover:text-white focus-visible:outline-none" href="#kkk">
              KKK
            </a>
            <a
              className="hover:text-white focus-visible:outline-none"
              href="#tookandjatele"
            >
              Tööandjatele
            </a>
            <a
              className="hover:text-white focus-visible:outline-none"
              href="#kuidas-tootab"
            >
              Kuidas töötab
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

