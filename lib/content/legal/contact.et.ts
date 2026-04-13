import type { ContactPageContent } from "./types";

import { PL } from "./placeholders";

export const contactET: ContactPageContent = {
  path: "/kontakt",
  metaTitle: "Kontakt",
  metaDescription: "Võta meiega ühendust — loeme kirjad ja vastame tööpäeviti.",
  h1: "Kontakt",
  lead: "Küsimus platvormi kohta või tahad lihtsalt kirjutada? Vastame tööpäeviti nii kiiresti kui saame.",
  lastUpdated: "2026-04-13",
  blocks: [
    {
      title: "Ettevõte",
      lines: [
        "Kvalifits OÜ",
        `Registrikood: ${PL.registryCode}`,
        `Aadress: ${PL.legalAddress}`,
        "Üldkontakt: [e-post]",
        "Telefon: [telefon]",
      ],
      icon: "building2",
      span: 2,
    },
    {
      title: "Privaatsus",
      lines: ["Konto või isikuandmed: [e-post]"],
      icon: "mail",
      span: 1,
    },
    {
      title: "Telefon ja tööaeg",
      lines: ["Vastame tööpäeviti: [kellaajad]"],
      icon: "phone",
      span: 1,
    },
    {
      title: "Veeb ja sotsiaalmeedia",
      lines: ["Veeb: kvalifits.ee", "Sotsiaalmeedia — täpsustame peagi"],
      icon: "share2",
      span: 2,
    },
  ],
  blocksAside: {
    title: "Kontaktandmed",
    lead: "Ettevõtte, privaatsuse ja üldkontakti info — vajadusel uuendame andmeid vastavalt olukorrale.",
  },
  formAside: {
    title: "Kirjuta meile",
    lead: "Täida väljad — avaneb sinu e-post ja saad kiri enne saatmist ise üle vaadata.",
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
  formMailTo: "info@kvalifits.ee",
};
