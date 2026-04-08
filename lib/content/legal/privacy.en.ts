import type { LegalDocument } from "./types";

import { PL } from "./placeholders";

export const privacyEN: LegalDocument = {
  path: "/privaatsus",
  metaTitle: "Privacy policy",
  metaDescription:
    "How Kvalifits collects, uses and protects personal data. Your rights, cookies and contact details.",
  h1: "Privacy policy",
  lead: `This document describes how ${PL.operatorName} (“we” or “the platform”) processes personal data in the Kvalifits service. We take privacy seriously and process data in line with applicable Estonian law and, where relevant, the EU General Data Protection Regulation (GDPR).`,
  lastUpdated: "2026-04-08",
  sections: [
    {
      id: "andmekaitse",
      title: "Purpose and controller",
      paragraphs: [
        `The controller is ${PL.companyName}, registry code ${PL.registryCode}, located at ${PL.legalAddress}. For privacy matters contact ${PL.emailPrivacy}.`,
        "If you are in the EU, you have GDPR rights including access, rectification, erasure, restriction, objection where applicable, and the right to lodge a complaint with a supervisory authority (in Estonia, the Data Protection Inspectorate).",
      ],
    },
    {
      id: "kogutavad-andmed",
      title: "Data we collect",
      paragraphs: [
        "Depending on whether you use the platform as a job seeker, employer, or both, we may process:",
      ],
      listItems: [
        "Account data: name, email, password hash (not the plain password), account type and settings.",
        "Profile data: for job seekers e.g. education, experience, skills, languages, target roles; for employers company name, contact person, job posting content.",
        "Documents and evidence: certificates, licences or other files you choose to upload.",
        "Communications: messages or requests sent through the platform where that feature exists.",
        "Technical data: IP address, browser, device type, logs (e.g. sign-in time), information from cookies as described in our cookie policy.",
        "Usage analytics: page views and interactions where we use analytics (only with consent or another lawful basis as stated).",
      ],
    },
    {
      id: "kasutus",
      title: "How we use data",
      paragraphs: ["We process personal data only for defined purposes:"],
      listItems: [
        "Providing and securing your account (contract; legitimate interests).",
        "Operating the platform: profiles, listings, matching, notifications (contract).",
        "Improving quality, support and troubleshooting (legitimate interests or contract).",
        "Legal compliance including retention where the law requires.",
        "Email marketing only with separate consent or where permitted by law.",
      ],
    },
    {
      id: "oiguslik-alus",
      title: "Legal bases",
      paragraphs: [
        "Processing may rely on: performance of a contract with you; our legitimate interests (e.g. security and development) balanced against your rights; your consent (e.g. non-essential cookies or marketing); or legal obligation.",
      ],
    },
    {
      id: "sailitamine",
      title: "Retention",
      paragraphs: [
        "We keep data only as long as needed for the purpose, unless a longer period is required by law.",
        "When you close an account, we delete or anonymise personal data within a reasonable time, except where we must retain data by law or for resolving disputes.",
      ],
    },
    {
      id: "edastamine",
      title: "Sharing",
      paragraphs: ["We do not sell your personal data. Limited sharing may occur with:"],
      listItems: [
        "Processors (e.g. cloud, email) under agreements and our instructions.",
        "If you are a job seeker, profile information may be visible to employers using the platform, subject to your choices and product design.",
        "Authorities when required by law or to protect legitimate interests.",
      ],
    },
    {
      id: "kolmandad-riigid",
      title: "Transfers outside the EEA",
      paragraphs: [
        "If we use providers outside the EEA, we implement appropriate safeguards (e.g. standard contractual clauses) where required.",
      ],
    },
    {
      id: "oigused",
      title: "Your rights",
      paragraphs: [
        "You may request access, rectification, erasure (where applicable), restriction, object to processing based on legitimate interests, and withdraw consent where processing is consent-based.",
        "See /en/andmekaitse for how to submit requests. Contact: " + PL.emailPrivacy + ".",
      ],
    },
    {
      id: "kupsised",
      title: "Cookies and analytics",
      paragraphs: [
        "We use cookies for operation, preferences and — with consent — statistics. Details: /en/kupsised.",
      ],
    },
    {
      id: "turvalisus",
      title: "Security",
      paragraphs: [
        "We apply technical and organisational measures to protect data. No online service can guarantee absolute security.",
      ],
    },
    {
      id: "muudatused",
      title: "Changes",
      paragraphs: [
        "We may update this policy. Material changes will be communicated on the platform or by email where appropriate.",
      ],
    },
    {
      id: "kontakt",
      title: "Contact",
      paragraphs: [`Privacy: ${PL.emailPrivacy}. General: ${PL.emailGeneral}.`],
    },
  ],
  footnote:
    "This text is general information and is not a substitute for legal advice. Replace placeholders and have counsel review before going live.",
};
