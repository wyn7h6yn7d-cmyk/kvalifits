import type { CompanyPageContent } from "./types";

import { PL } from "./placeholders";

export const companyEN: CompanyPageContent = {
  path: "/ettevote",
  metaTitle: "Company",
  metaDescription:
    "Operator information for the Kvalifits platform — skills-based recruitment in Estonia.",
  h1: "Company information",
  lead: "Key information about the Kvalifits platform.",
  lastUpdated: "2026-04-13",
  sections: [
    {
      id: "operaator",
      title: "Company",
      paragraphs: [
        "Kvalifits OÜ",
        `Registry code: ${PL.registryCode}`,
        `Address: ${PL.legalAddress}`,
        "General contact: [email]",
        "Phone: [phone]",
      ],
    },
    {
      id: "kontakt-ettevote",
      title: "Privacy",
      paragraphs: ["Account or personal data: [email]"],
    },
    {
      id: "eesmark",
      title: "Mission",
      paragraphs: [
        "Kvalifits aims to reduce noise in the labour market by making verifiable skills visible, clarifying fit, and supporting fairer hiring. The platform evolves with user feedback.",
        "Kvalifits OÜ develops and operates the Kvalifits web platform for skills-based recruitment in Estonia, connecting job seekers’ evidence and employers’ requirements.",
      ],
    },
  ],
};
