import type { ContactPageContent } from "./types";

import {
  LEGAL_COPY_UPDATED,
  companyIdentityLines,
  contactFormMailto,
  legalPrelaunchFootnote,
} from "./placeholders";

export const contactET: ContactPageContent = {
  path: "/kontakt",
  metaTitle: "Kontakt",
  metaDescription: "Võta meiega ühendust — loeme kirjad ja vastame tööpäeviti.",
  h1: "Kontakt",
  lead: "Küsimus Kvalifitsi kohta? Kasuta allolevat vormi. Vastame tööpäeviti.",
  lastUpdated: LEGAL_COPY_UPDATED,
  blocks: [
    {
      title: "Kvalifits",
      lines: companyIdentityLines("et"),
      icon: "building2",
      span: 2,
    },
    {
      title: "Veeb",
      lines: ["kvalifits.ee"],
      icon: "share2",
      span: 2,
    },
  ],
  blocksAside: {
    title: "Kuidas ühendust võtta",
    lead: "Ametlikku ettevõtte e-posti, telefoni ja aadressi avaldame pärast juriidilise isiku registreerimist. Seni kasuta vormi.",
  },
  form: {
    nameLabel: "Nimi",
    emailLabel: "E-post",
    subjectLabel: "Teema",
    messageLabel: "Sõnum",
    submitLabel: "Saada e-kiri",
    privacyHint: "Kasutame sinu kontakti ainult vastamiseks. Loe lähemalt: /privaatsus.",
    successNote: "Avaneb sinu e-post — vaata kiri veel kord enne saatmist.",
  },
  formMailTo: contactFormMailto(),
  footnote: legalPrelaunchFootnote("et"),
};
