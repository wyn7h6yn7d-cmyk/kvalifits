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
      title: "Privacy",
      lines: ["Account or personal data: [email]"],
      icon: "mail",
      span: 1,
    },
    {
      title: "Phone & hours",
      lines: ["We reply on business days: [hours]"],
      icon: "phone",
      span: 1,
    },
    {
      title: "Web & social",
      lines: ["Website: kvalifits.ee", "Social — we’ll add links soon"],
      icon: "share2",
      span: 2,
    },
  ],
  formAside: {
    title: "Write to us",
    lead: "Fill in the fields — your mail app opens so you can review before sending.",
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
