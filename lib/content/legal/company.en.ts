import type { CompanyPageContent } from "./types";

import {
  LEGAL_COPY_UPDATED,
  companyIdentityLines,
  companyMissionOperatorSentence,
  publicPrivacyContact,
} from "./placeholders";

export const companyEN: CompanyPageContent = {
  path: "/ettevote",
  metaTitle: "Platform",
  metaDescription:
    "About the Kvalifits platform — skills-based recruitment in Estonia.",
  h1: "Platform",
  lead: "Kvalifits is a skills-based recruitment platform. Registered company details will be published after the legal entity is created.",
  lastUpdated: LEGAL_COPY_UPDATED,
  sections: [
    {
      id: "operaator",
      title: "Operator",
      paragraphs: companyIdentityLines("en"),
    },
    {
      id: "kontakt-ettevote",
      title: "Privacy",
      paragraphs: [`Account or personal data: ${publicPrivacyContact("en")}.`],
    },
    {
      id: "eesmark",
      title: "Mission",
      paragraphs: [
        "Kvalifits aims to reduce noise in the labour market by making verifiable skills visible, clarifying fit, and supporting fairer hiring. The platform evolves with user feedback.",
        companyMissionOperatorSentence("en"),
      ],
    },
  ],
};
