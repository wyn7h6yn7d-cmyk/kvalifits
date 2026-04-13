import type { ContactPageContent } from "./types";

import { PL } from "./placeholders";

export const contactEN: ContactPageContent = {
  path: "/kontakt",
  metaTitle: "Contact",
  metaDescription:
    "Contact Kvalifits: email, company details and contact form.",
  h1: "Contact",
  lead: "Questions about the platform, partnerships or data protection? Write to us — we respond as soon as we can.",
  lastUpdated: "2026-04-13",
  blocks: [
    {
      title: "Company",
      lines: [
        PL.companyName,
        `Registry code: ${PL.registryCode}`,
        `Address: ${PL.legalAddress}`,
      ],
      icon: "building2",
      span: 2,
    },
    {
      title: "Email",
      lines: [`General: ${PL.emailGeneral}`, `Privacy: ${PL.emailPrivacy}`],
      icon: "mail",
      span: 1,
    },
    {
      title: "Phone & hours",
      lines: [
        "[Phone number — we’ll publish this soon]",
        "[Business hours / typical response time — TBA]",
      ],
      icon: "phone",
      span: 1,
    },
    {
      title: "Web & social",
      lines: ["[Official website / social channels — coming soon]"],
      icon: "share2",
      span: 2,
    },
    {
      title: "Requests",
      lines: [
        "Please mark data protection and deletion requests clearly in the subject line.",
        "We aim to respond within one month; details: /en/andmekaitse.",
      ],
      icon: "clock",
      span: 2,
    },
  ],
  formAside: {
    title: "Write to us",
    lead: "Fill in the fields — your mail app will open so you can review the message before sending.",
  },
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
  footnote:
    "Placeholders (phone, hours, social links) will be replaced with real details; keep this page aligned with the footer.",
};
