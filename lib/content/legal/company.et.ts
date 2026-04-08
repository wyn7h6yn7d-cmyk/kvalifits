import type { CompanyPageContent } from "./types";

import { PL } from "./placeholders";

export const companyET: CompanyPageContent = {
  path: "/ettevote",
  metaTitle: "Ettevõte",
  metaDescription:
    "Kvalifitsi platvormi operaatori andmed, eesmärk ja kontakt — pädevuspõhine töövahendus Eestis.",
  h1: "Ettevõtte info",
  lead: `Siin on Kvalifitsi platvormi operaatori põhiandmed. Osad väljad on märgitud kui placeholderid — need tuleb enne avalikku kasutust asendada päris andmetega.`,
  lastUpdated: "2026-04-08",
  sections: [
    {
      id: "operaator",
      title: "Platvormi operaator",
      paragraphs: [
        `Ärinimi: ${PL.companyName}`,
        `Registrikood: ${PL.registryCode}`,
        `Juriidiline aadress: ${PL.legalAddress}`,
        `Tegevuse kirjeldus: ${PL.operatorName} arendab ja haldab veebiplatvormi Kvalifits, mis toetab pädevuspõhist töövahendust Eestis — tööotsijate oskuste ja tõendite ning tööandjate nõuete kohtumist ühes keskkonnas.`,
      ],
    },
    {
      id: "kontakt-ettevote",
      title: "Kontakt",
      paragraphs: [
        `Üldkontakt: ${PL.emailGeneral}`,
        `Andmekaitse: ${PL.emailPrivacy}`,
      ],
    },
    {
      id: "eesmark",
      title: "Eesmärk",
      paragraphs: [
        "Kvalifitsi eesmärk on vähendada müra tööturul: teha nähtavaks kontrollitav pädevus, selgitada sobivust ja toetada ausamat värbamist. Platvorm areneb järk-järgult koos kasutajate tagasisidega.",
      ],
    },
  ],
};
