import type { ContactPageContent } from "./types";

import { PL } from "./placeholders";

export const contactEN: ContactPageContent = {
  path: "/kontakt",
  metaTitle: "Contact",
  metaDescription: "Get in touch — we read every message and reply on business days.",
  h1: "Contact",
  lead: "Question about the platform, or just want to say hello? We reply on business days as soon as we can.",
  lastUpdated: "2026-04-13",
  blocks: [
    {
      title: "Company",
      lines: [
        "Kvalifits OÜ",
        `Registry code: ${PL.registryCode}`,
        `Address: ${PL.legalAddress}`,
        "General contact: [email]",
        "Phone: [phone]",
      ],
      icon: "building2",
      span: 2,
    },
    {
      title: "Web & social",
      lines: ["Website: kvalifits.ee", "Social — we’ll add links soon"],
      icon: "share2",
      span: 2,
    },
  ],
  blocksAside: {
    title: "Contact details",
    lead: "Company and web — we update these as needed.",
  },
  form: {
    nameLabel: "Name",
    emailLabel: "Email",
    subjectLabel: "Subject",
    messageLabel: "Message",
    submitLabel: "Open email",
    privacyHint: "We only use your contact details to reply. More here: /en/privaatsus.",
    successNote: "Your mail app will open — give the message a quick read before sending.",
  },
  formMailTo: "info@kvalifits.ee",
};
