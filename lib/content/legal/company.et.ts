import type { CompanyPageContent } from "./types";

import {
  LEGAL_COPY_UPDATED,
  companyIdentityLines,
  companyMissionOperatorSentence,
  publicPrivacyContact,
} from "./placeholders";

export const companyET: CompanyPageContent = {
  path: "/ettevote",
  metaTitle: "Platvorm",
  metaDescription:
    "Kvalifitsi platvormi eesmärk ja operaatori andmed — pädevuspõhine töövahendus Eestis.",
  h1: "Platvorm",
  lead: "Kvalifits on pädevuspõhine töövahendusplatvorm. Juriidilise isiku andmed avaldatakse pärast registreerimist.",
  lastUpdated: LEGAL_COPY_UPDATED,
  sections: [
    {
      id: "operaator",
      title: "Operaator",
      paragraphs: companyIdentityLines("et"),
    },
    {
      id: "kontakt-ettevote",
      title: "Privaatsus",
      paragraphs: [`Konto või isikuandmed: ${publicPrivacyContact("et")}.`],
    },
    {
      id: "eesmark",
      title: "Eesmärk",
      paragraphs: [
        "Kvalifitsi eesmärk on vähendada müra tööturul: teha nähtavaks kontrollitav pädevus, selgitada sobivust ja toetada ausamat värbamist. Platvorm areneb järk-järgult koos kasutajate tagasisidega.",
        companyMissionOperatorSentence("et"),
      ],
    },
  ],
};
