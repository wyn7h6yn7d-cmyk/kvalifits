export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "Täistööaeg" | "Osaline" | "Vahetused" | "Projekt";
  salary?: string;
  tags: string[];
  requiredCerts: string[];
  verified: boolean;
  matchPercent: number;
  highlights: string[];
};

export const MOCK_JOBS: Job[] = [
  {
    id: "job-eh-1",
    title: "Hooldus-elektrik",
    company: "NordVolt Hooldus",
    location: "Tallinn",
    type: "Täistööaeg",
    salary: "€1,900–2,500",
    tags: ["Elektrik", "A-pädevus", "Objektid"],
    requiredCerts: ["A-pädevus"],
    verified: true,
    matchPercent: 87,
    highlights: [
      "Sertifikaat kontrollitud",
      "Sobivus vastab nõuetele",
      "Kogemus hinnatud",
    ],
  },
  {
    id: "job-it-1",
    title: "Full‑stack arendaja",
    company: "KlaarTech",
    location: "Tartu / hübriid",
    type: "Täistööaeg",
    salary: "€2,800–4,200",
    tags: ["TypeScript", "Next.js", "Toode"],
    requiredCerts: [],
    verified: true,
    matchPercent: 82,
    highlights: ["Portfoolio signaalid", "Sobivus 80%+", "Selged nõuded"],
  },
  {
    id: "job-hc-1",
    title: "Õde (päevane vahetus)",
    company: "LinnaKliinik",
    location: "Tallinn",
    type: "Vahetused",
    salary: "€1,800–2,300",
    tags: ["Tervishoid", "Kutsetunnistus", "Vahetused"],
    requiredCerts: ["Kutsetunnistus"],
    verified: true,
    matchPercent: 78,
    highlights: ["Kvalifikatsioon nähtav", "Teavitused sobivuste kohta"],
  },
  {
    id: "job-lg-1",
    title: "Laotööline / tõstukijuht",
    company: "LogiPro",
    location: "Harjumaa",
    type: "Vahetused",
    salary: "€1,400–1,850",
    tags: ["Logistika", "Tõstuk", "Kiire start"],
    requiredCerts: ["Tõstukiluba"],
    verified: false,
    matchPercent: 69,
    highlights: ["Sertifikaat soovituslik", "Sobivus pareneb tõenditega"],
  },
  {
    id: "job-bt-1",
    title: "Juuksur‑stilist",
    company: "Studio Noir",
    location: "Pärnu",
    type: "Osaline",
    salary: "kliendipõhine",
    tags: ["Ilu", "Teenindus", "Portfoolio"],
    requiredCerts: ["Kutse tase 4"],
    verified: true,
    matchPercent: 84,
    highlights: ["Portfoolio + kogemus", "Usaldus signaalides"],
  },
  {
    id: "job-mfg-1",
    title: "CNC operaator",
    company: "MetalWorks",
    location: "Ida‑Virumaa",
    type: "Täistööaeg",
    salary: "€1,700–2,400",
    tags: ["Tootmine", "CNC", "Ohutus"],
    requiredCerts: ["Tööohutus"],
    verified: true,
    matchPercent: 76,
    highlights: ["Ohutus kontrollitud", "Nõuded selged"],
  },
];

