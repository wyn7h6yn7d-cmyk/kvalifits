import type { LegalDocument } from "./types";

import { PL } from "./placeholders";

export const termsEN: LegalDocument = {
  path: "/tingimused",
  metaTitle: "Terms of use",
  metaDescription:
    "Rules for using the Kvalifits platform: accounts, roles, liability, changes and contact.",
  h1: "Terms of use",
  lead: `These terms apply to your use of the Kvalifits website and services provided by ${PL.operatorName}. By using the platform you confirm that you have read and accept these terms. If you do not agree, do not use the service.`,
  lastUpdated: "2026-04-08",
  sections: [
    {
      id: "teenus",
      title: "Service and parties",
      paragraphs: [
        `Kvalifits is a skills-based recruitment platform. The provider is ${PL.companyName} (${PL.registryCode}), ${PL.legalAddress}. A “user” is any person or legal entity that creates an account or otherwise uses the service.`,
      ],
    },
    {
      id: "kes-voib",
      title: "Who may use the platform",
      paragraphs: [
        "Users must be at least 18 (or use the service with appropriate parental/guardian consent where the law allows). Employers must register as authorised representatives of the organisation.",
        "You must provide accurate account and contact information. Impersonation or false identity is prohibited.",
      ],
    },
    {
      id: "konto",
      title: "User account",
      paragraphs: [
        "Registration requires accepting these terms and the privacy policy.",
        "You are responsible for keeping credentials confidential. Notify us promptly of suspected unauthorised use.",
        "Multiple accounts used to evade restrictions, manipulate matching, or deceive others are prohibited.",
      ],
    },
    {
      id: "rollid",
      title: "Job seeker and employer roles",
      paragraphs: [
        "As a job seeker you may create a profile, present skills and evidence, and apply or respond to opportunities as features allow.",
        "As an employer you may publish roles, define requirements and review candidates as features allow.",
        "The same user may hold both roles if the product allows; obligations apply to each role.",
      ],
    },
    {
      id: "sisu-vastutus",
      title: "Your responsibility for content",
      paragraphs: [
        "You are solely responsible for all data, text, files and other content you submit. Content must not infringe third-party rights or violate applicable law (including non-discrimination, data protection, copyright).",
        "Abusive, misleading, malicious or illegal content including malware or spam is prohibited.",
      ],
    },
    {
      id: "sertifikaadid",
      title: "Accuracy of certificates and qualifications",
      paragraphs: [
        "You confirm that certificates, licences and evidence you submit relate to you or you are entitled to present them. False information may lead to account closure and legal consequences.",
        "The platform may offer verification or labelling tools but does not replace an employer’s own checks. We do not warrant that all evidence is automatically accurate.",
      ],
    },
    {
      id: "platvormi-oigused",
      title: "Our rights regarding content",
      paragraphs: [
        "We may remove or restrict content that breaches these terms, is misleading or harmful, or undermines other users or the service.",
        "We may suspend or close accounts for serious breach, fraud or legal requirement. We will warn where reasonable, except in severe cases.",
      ],
    },
    {
      id: "piirang",
      title: "Limitation of liability",
      paragraphs: [
        "The service is provided “as is”. We aim for stable operation but do not guarantee uninterrupted availability or that matching or hiring will achieve specific results.",
        "To the maximum extent permitted by law we are not liable for indirect loss including lost profits. Employment relationships are between job seeker and employer unless expressly agreed otherwise in writing.",
      ],
    },
    {
      id: "peatamine",
      title: "Suspension and closure",
      paragraphs: [
        "You may request account closure as described in the privacy policy and data rights page.",
        "We may suspend the service for maintenance, updates or force majeure and will give notice where practical for material changes.",
      ],
    },
    {
      id: "muutmine",
      title: "Changes to terms",
      paragraphs: [
        "We may update these terms. The new version will be published with an updated date. Continued use after the effective date constitutes acceptance; material changes may require renewed confirmation.",
      ],
    },
    {
      id: "kontakt-tingimused",
      title: "Contact",
      paragraphs: [`Questions: ${PL.emailGeneral}.`],
    },
  ],
  footnote:
    "This is a framework for review. Replace placeholders and obtain legal sign-off before production use.",
};
