import type { ContactPageContent } from "./types";

import { PL } from "./placeholders";

export const contactEN: ContactPageContent = {
  path: "/kontakt",
  metaTitle: "Contact",
  metaDescription:
    "Contact Kvalifits: email, company details and contact form.",
  h1: "Contact",
  lead: "Questions about the platform, partnerships or data protection? Write to us — we respond as soon as we can.",
  lastUpdated: "2026-04-08",
  blocks: [
    {
      title: "Company",
      lines: [
        PL.companyName,
        `Registry code: ${PL.registryCode}`,
        `Address: ${PL.legalAddress}`,
      ],
    },
    {
      title: "Email",
      lines: [`General: ${PL.emailGeneral}`, `Privacy: ${PL.emailPrivacy}`],
    },
    {
      title: "Requests",
      lines: [
        "Please mark data protection and deletion requests clearly in the subject line.",
        "We aim to respond within one month; details: /en/andmekaitse.",
      ],
    },
  ],
  form: {
    nameLabel: "Name",
    emailLabel: "Email",
    subjectLabel: "Subject",
    messageLabel: "Message",
    submitLabel: "Open email",
    privacyHint:
      "By sending a message you confirm you have read the privacy policy (/en/privaatsus) and that we may use your contact details only to respond.",
    successNote: "Your mail client will open — please review the message before sending.",
  },
  footnote: "Add phone or office address here and in the footer when available.",
};
