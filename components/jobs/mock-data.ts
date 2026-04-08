export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "Täistööaeg" | "Osaline" | "Vahetused" | "Projekt";
  salary?: string;
  tags: string[];
  requiredCerts: string[];
  /** Valdkond — vastab filtrite „Valdkond“ kiipidele */
  domains?: string[];
  /** Nõutud või eelistatud keeled töökohal */
  languages?: string[];
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
    tags: ["Elektrik", "A-pädevus", "Objektid", "Töötamine kõrguses"],
    requiredCerts: ["A-pädevus"],
    domains: ["Energeetika", "Ehitus"],
    languages: ["Eesti keel"],
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
    tags: ["TypeScript", "React", "Next.js", "Toode", "Docker", "Hübriid"],
    requiredCerts: [],
    domains: ["IT"],
    languages: ["Eesti keel", "Inglise keel"],
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
    tags: ["Tervishoid", "Kutsetunnistus", "Vahetused", "First aid / esmaabi"],
    requiredCerts: ["Kutsetunnistus"],
    domains: ["Tervishoid"],
    languages: ["Eesti keel"],
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
    tags: ["Logistika", "Tõstuk", "Kiire start", "B-kategooria juhiluba"],
    requiredCerts: ["Tõstukiluba"],
    domains: ["Logistika"],
    languages: ["Eesti keel", "Vene keel"],
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
    domains: ["Ilu", "Teenindus"],
    languages: ["Eesti keel"],
    verified: true,
    matchPercent: 84,
    highlights: ["Portfoolio + kogemus", "Usaldus signaalides"],
  },
  {
    id: "job-mfg-1",
    title: "CNC operaator",
    company: "MetalWorks",
    location: "Ida-Virumaa",
    type: "Täistööaeg",
    salary: "€1,700–2,400",
    tags: ["Tootmine", "CNC", "Ohutus", "AutoCAD"],
    requiredCerts: ["Tööohutus"],
    domains: ["Tootmine"],
    languages: ["Eesti keel", "Vene keel"],
    verified: true,
    matchPercent: 76,
    highlights: ["Ohutus kontrollitud", "Nõuded selged"],
  },
  {
    id: "job-data-1",
    title: "Andmeanalüütik",
    company: "StatsHub",
    location: "Kaugtoo",
    type: "Täistööaeg",
    salary: "€2,400–3,200",
    tags: ["Python", "SQL", "Excel (täpne)", "Andmed", "Linux"],
    requiredCerts: [],
    domains: ["IT"],
    languages: ["Inglise keel", "Keele tase B2+"],
    verified: true,
    matchPercent: 81,
    highlights: ["Tööriistad nähtavad", "Sobivus signaalidega"],
  },
  {
    id: "job-pm-1",
    title: "IT-projektijuht",
    company: "KlaarTech",
    location: "Tallinn",
    type: "Täistööaeg",
    salary: "€3,000–3,800",
    tags: ["Projektijuhtimine", "SAP kasutaja", "Agile", "IT"],
    requiredCerts: [],
    domains: ["IT"],
    languages: ["Eesti keel", "Inglise keel"],
    verified: true,
    matchPercent: 79,
    highlights: ["Protsessid paigas", "Sertifikaadid soovituslikud"],
  },
];

