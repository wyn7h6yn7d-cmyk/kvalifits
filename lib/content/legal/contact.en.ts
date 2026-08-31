import type { ContactPageContent } from "./types";

import {
  LEGAL_COPY_UPDATED,
  companyIdentityLines,
  contactFormMailto,
  legalPrelaunchFootnote,
} from "./placeholders";

export const contactEN: ContactPageContent = {
  path: "/kontakt",
  metaTitle: "Contact",
  metaDescription: "Get in touch — we read every message and reply on business days.",
  h1: "Contact",
  lead: "Question about Kvalifits? Use the form below. We reply on business days.",
  lastUpdated: LEGAL_COPY_UPDATED,
  blocks: [
    {
      title: "Kvalifits",
      lines: companyIdentityLines("en"),
      icon: "building2",
      span: 2,
    },
    {
      title: "Web",
      lines: ["kvalifits.ee"],
      icon: "share2",
      span: 2,
    },
  ],
  blocksAside: {
    title: "How to reach us",
    lead: "Official company email, phone and address will be published after the legal entity is registered. Until then, use the form.",
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
  formMailTo: contactFormMailto(),
  footnote: legalPrelaunchFootnote("en"),
};
