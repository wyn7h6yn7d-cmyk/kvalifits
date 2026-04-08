import type { CompanyPageContent } from "./types";

import { PL } from "./placeholders";

export const companyEN: CompanyPageContent = {
  path: "/ettevote",
  metaTitle: "Company",
  metaDescription:
    "Operator information for the Kvalifits platform — skills-based recruitment in Estonia.",
  h1: "Company information",
  lead: `Below are the key details for the Kvalifits platform operator. Fields marked as placeholders must be replaced with real data before public launch.`,
  lastUpdated: "2026-04-08",
  sections: [
    {
      id: "operaator",
      title: "Operator",
      paragraphs: [
        `Legal name: ${PL.companyName}`,
        `Registry code: ${PL.registryCode}`,
        `Registered address: ${PL.legalAddress}`,
        `Description: ${PL.operatorName} develops and operates the Kvalifits web platform for skills-based recruitment in Estonia, connecting job seekers’ evidence and employers’ requirements.`,
      ],
    },
    {
      id: "kontakt-ettevote",
      title: "Contact",
      paragraphs: [`General: ${PL.emailGeneral}`, `Privacy: ${PL.emailPrivacy}`],
    },
    {
      id: "eesmark",
      title: "Mission",
      paragraphs: [
        "Kvalifits aims to reduce noise in the labour market by making verifiable skills visible, clarifying fit, and supporting fairer hiring. The platform evolves with user feedback.",
      ],
    },
  ],
};
