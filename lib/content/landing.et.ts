export const landingET = {
  nav: {
    home: "Avaleht",
    jobs: "Tööpakkumised",
    employers: "Tööandjale",
    seekers: "Tööotsijale",
    how: "Kuidas toimib",
    pricing: "Hinnakiri",
    login: "Logi sisse",
    signup: "Registreeru",
  },
  hero: {
    badge: "Kontrollitud oskused. Selgemad valikud.",
    headline: "Leia töö, mis sobib sinu oskustega.",
    subheadline:
      "Kvalifits aitab võrrelda sinu oskusi ja eelistusi tööandja nõuetega — ning näitab, miks töö sulle sobib.",
    primaryCta: "Otsi tööpakkumisi",
    secondaryCta: "Olen tööandja",
  },
  roleSplit: {
    title: "Tööotsijale ja tööandjale",
    subtitle: "Üks profiil, selged nõuded ja nähtav sobivus.",
    seeker: {
      title: "Tööotsija",
      points: [
        "Lisa oskused ja kogemus üks kord",
        "Lisa sertifikaadid ja load",
        "Näe, millised tööd sulle sobivad",
        "Kandideeri kiirelt",
      ],
      cta: "Loo profiil",
    },
    employer: {
      title: "Tööandja",
      points: [
        "Lisa tööpakkumine ja nõuded",
        "Määra vajalikud oskused ja sertifikaadid",
        "Näe esmalt sobivamaid kandidaate",
        "Vähem ebasobivaid kandideerimisi",
      ],
      cta: "Olen tööandja",
    },
  },
  trust: {
    title: "Tööportaal, kus oskused on võrreldavad.",
    subtitle:
      "Tööandja näeb kontrollitud pädevusi. Tööotsija näeb, miks töö talle sobib.",
    cards: [
      {
        title: "Kontrollitud sertifikaadid",
        desc: "Lisa dokumendid profiilile. Tööandja näeb staatust enne vestlust.",
      },
      {
        title: "Sobivus nõuete järgi",
        desc: "Võrdleme oskusi, kogemust ja sertifikaate — mitte ainult märksõnu CV-s.",
      },
      {
        title: "Selged põhjused",
        desc: "Näed, mis klapib, mis on osaline ja mis puudub.",
      },
      {
        title: "Vähem oletamist",
        desc: "Esmalt kandidaadid ja tööd, mis nõuetele vastavad.",
      },
    ],
  },
  howItWorks: {
    title: "Kuidas Kvalifits toimib",
    subtitle: "Lisa andmed üks kord. Võrdlus käib nõuete järgi.",
    seeker: {
      title: "Tööotsijale",
      steps: ["Loo konto", "Lisa oskused ja sertifikaadid", "Näe sobivaid töid", "Kandideeri"],
    },
    employer: {
      title: "Tööandjale",
      steps: ["Lisa tööpakkumine", "Määra nõuded", "Vaata sobivamaid kandidaate", "Kutsu vestlusele"],
    },
  },
  industries: {
    title: "Erinevatele ametitele",
    subtitle: "Kontoritööst praktikaoskusteni — IT-st ehituseni, tervishoiust logistikani.",
    items: [
      "IT ja arendus",
      "Elektritööd",
      "Ehitus",
      "Tervishoid",
      "Logistika",
      "Tootmine",
      "Ilu ja teenindus",
      "Turundus ja disain",
    ],
  },
  matching: {
    title: "Näe, miks töö sulle sobib",
    subtitle: "Sobivus näitab, mis klapib tööandja nõuetega — ja mis veel puudub.",
    notifications: [
      "Vajalik sertifikaat on olemas.",
      "See töö sobib sinu kogemusega.",
      "Selle kandidaadi oskused vastavad tööpakkumisele.",
    ],
  },
  dashboards: {
    title: "Selge vaade mõlemale poolele",
    subtitle: "Profiil, tööpakkumised, kandideerimised ja sobivus ühes kohas.",
    seeker: {
      title: "Tööotsija",
      items: ["Minu profiil", "Sertifikaadid", "Minu sobivused", "Kandideerimised", "Teavitused"],
    },
    employer: {
      title: "Tööandja",
      items: ["Tööpakkumised", "Kandidaadid", "Sobivus", "Sõnumid", "Ettevõte"],
    },
  },
  filters: {
    title: "Filtreeri tegelike nõuete järgi",
    subtitle: "Asukoht, töökoormus, oskused, sertifikaadid ja keeled.",
    pills: ["Elektrik", "A-pädevus", "Tallinn", "5+ aastat", "Eesti keel"],
    facets: ["sertifikaat", "kvalifikatsioon", "amet", "ettevõte", "asukoht", "kogemus", "keeled"],
  },
  trustSignals: {
    title: "Faktid, mitte loosungid",
    subtitle: "Fookus: kontrollitud oskused ja selge sobivus. Ilma väljamõeldud mõõdikuteta.",
    stats: [],
  },
  cta: {
    title: "Leia töö, mis sobib sinu oskustega.",
    primary: "Otsi tööpakkumisi",
    secondary: "Olen tööandja",
  },
  footer: {
    blurb: "Kvalifits on Eesti tööportaal, kus oskused ja nõuded on selgelt võrreldavad.",
    links: {
      jobs: "Tööpakkumised",
      employers: "Tööandjale",
      seekers: "Tööotsijale",
      contact: "Kontakt",
      privacy: "Privaatsus",
      terms: "Tingimused",
    },
    language: "Keel",
    et: "ET",
    en: "EN",
  },
} as const;
