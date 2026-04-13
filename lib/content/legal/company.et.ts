import type { CompanyPageContent } from "./types";

import { PL } from "./placeholders";

export const companyET: CompanyPageContent = {
  path: "/ettevote",
  metaTitle: "Ettevõte",
  metaDescription:
    "Kvalifitsi platvormi operaatori andmed, eesmärk ja kontakt — pädevuspõhine töövahendus Eestis.",
  h1: "Ettevõtte info",
  lead: "Kvalifitsi platvormi põhiandmed.",
  lastUpdated: "2026-04-13",
  sections: [
    {
      id: "operaator",
      title: "Ettevõte",
      paragraphs: [
        "Kvalifits OÜ",
        `Registrikood: ${PL.registryCode}`,
        `Aadress: ${PL.legalAddress}`,
        "Üldkontakt: [e-post]",
        "Telefon: [telefon]",
      ],
    },
    {
      id: "kontakt-ettevote",
      title: "Privaatsus",
      paragraphs: ["Konto või isikuandmed: [e-post]"],
    },
    {
      id: "eesmark",
      title: "Eesmärk",
      paragraphs: [
        "Kvalifitsi eesmärk on vähendada müra tööturul: teha nähtavaks kontrollitav pädevus, selgitada sobivust ja toetada ausamat värbamist. Platvorm areneb järk-järgult koos kasutajate tagasisidega.",
        "Kvalifits OÜ arendab ja haldab veebiplatvormi Kvalifits, mis toetab pädevuspõhist töövahendust Eestis — tööotsijate oskuste ja tõendite ning tööandjate nõuete kohtumist ühes keskkonnas.",
      ],
    },
  ],
};
