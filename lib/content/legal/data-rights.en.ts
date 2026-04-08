import type { LegalDocument } from "./types";

import { PL } from "./placeholders";

export const dataRightsEN: LegalDocument = {
  path: "/andmekaitse",
  metaTitle: "Data subject rights and erasure",
  metaDescription:
    "How to request access, correction or deletion of your data on Kvalifits. Response times and contact.",
  h1: "Data subject rights and erasure",
  lead: `This page explains how to exercise your rights regarding personal data processed in Kvalifits by ${PL.operatorName}.`,
  lastUpdated: "2026-04-08",
  sections: [
    {
      id: "oigused-ulevaade",
      title: "Your rights",
      paragraphs: ["Depending on your situation you may have rights including:"],
      listItems: [
        "Confirmation of processing and access to your data.",
        "Rectification of inaccurate data.",
        "Erasure (“right to be forgotten”) where there is no longer a lawful basis or processing was unlawful.",
        "Restriction of processing in certain cases.",
        "Objection to processing based on legitimate interests.",
        "Data portability where processing is based on consent or contract and is automated.",
        "The right to lodge a complaint with a supervisory authority (Estonia: Data Protection Inspectorate).",
      ],
    },
    {
      id: "kuidas-taotleda",
      title: "How to submit a request",
      paragraphs: [
        `Email ${PL.emailPrivacy} with subject line “Data protection request” or use the form on /en/kontakt.`,
        "Include your name, email used on the account, type of request (copy, correction, deletion, etc.) and information needed to verify your identity. We may ask for proof to protect your data from fraudulent requests.",
      ],
    },
    {
      id: "vastamisajad",
      title: "Response times",
      paragraphs: [
        "We aim to respond within one month of receipt. Complex requests may be extended by up to two further months, with an explanation.",
      ],
    },
    {
      id: "kustutamine",
      title: "Account and data deletion",
      paragraphs: [
        "When you close an account we delete or anonymise personal data except where retention is required by law (e.g. accounting) or we have a limited legitimate interest in retaining data for dispute resolution.",
        "Some information may remain in aggregated form that does not identify you.",
      ],
    },
    {
      id: "muutmine",
      title: "Changing data yourself",
      paragraphs: [
        "Much profile data can be edited in account settings where the feature exists. Contact us for anything you cannot change yourself.",
      ],
    },
    {
      id: "kontakt",
      title: "Contact",
      paragraphs: [`Data requests: ${PL.emailPrivacy}. General: ${PL.emailGeneral}.`],
    },
  ],
  footnote: "Procedures should match your technical setup and legal review.",
};
