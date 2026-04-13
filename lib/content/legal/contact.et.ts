import type { ContactPageContent } from "./types";

import { PL } from "./placeholders";

export const contactET: ContactPageContent = {
  path: "/kontakt",
  metaTitle: "Kontakt",
  metaDescription:
    "Võta Kvalifitsiga ühendust: e-post, ettevõtte andmed ja kontaktivorm.",
  h1: "Kontakt",
  lead:
    "Kui sul on küsimusi platvormi, partnerluse või andmekaitse kohta, kirjuta meile. Vastame esimesel võimalusel.",
  lastUpdated: "2026-04-13",
  blocks: [
    {
      title: "Ettevõte",
      lines: [
        PL.companyName,
        `Registrikood: ${PL.registryCode}`,
        `Aadress: ${PL.legalAddress}`,
      ],
      icon: "building2",
      span: 2,
    },
    {
      title: "E-post",
      lines: [`Üldised küsimused: ${PL.emailGeneral}`, `Andmekaitse: ${PL.emailPrivacy}`],
      icon: "mail",
      span: 1,
    },
    {
      title: "Telefon ja tööaeg",
      lines: [PL.phone, PL.supportHours],
      icon: "phone",
      span: 1,
    },
    {
      title: "Veeb ja sotsiaalmeedia",
      lines: [PL.socialWeb],
      icon: "share2",
      span: 2,
    },
    {
      title: "Taotluste töötlemine",
      lines: [
        "Andmekaitse- ja kustutamistaotlused palun märgista selgelt teema real.",
        "Eesmärgiga vastame ühe kuu jooksul; üksikasjad: /andmekaitse.",
      ],
      icon: "clock",
      span: 2,
    },
  ],
  formAside: {
    title: "Kirjuta meile",
    lead: "Täida väljad — avaneb sinu e-posti rakendus ja saad kiri enne saatmist üle kontrollida.",
  },
  form: {
    nameLabel: "Nimi",
    emailLabel: "E-post",
    subjectLabel: "Teema",
    messageLabel: "Sõnum",
    submitLabel: "Saada e-kiri",
    privacyHint:
      "Saates sõnumi kinnitad, et oled tutvunud privaatsuspoliitikaga (/privaatsus) ja et sinu kontaktandmeid kasutatakse üksnes vastamiseks.",
    successNote: "Sinu e-posti klient avaneb — kontrolli sõnum enne saatmist.",
  },
  footnote:
    "Kohatäited (telefon, tööaeg, sotsiaalmeedia) asendatakse päris andmetega; hoia kontaktileht ja footer ühtsed.",
};
