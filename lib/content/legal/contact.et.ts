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
  lastUpdated: "2026-04-08",
  blocks: [
    {
      title: "Ettevõte",
      lines: [
        PL.companyName,
        `Registrikood: ${PL.registryCode}`,
        `Aadress: ${PL.legalAddress}`,
      ],
    },
    {
      title: "E-post",
      lines: [`Üldised küsimused: ${PL.emailGeneral}`, `Andmekaitse: ${PL.emailPrivacy}`],
    },
    {
      title: "Taotluste töötlemine",
      lines: [
        "Andmekaitse- ja kustutamistaotlused palun märgista selgelt teema real.",
        "Eesmärgiga vastame ühe kuu jooksul; üksikasjad: /andmekaitse.",
      ],
    },
  ],
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
    "Kui lisandub telefon või füüsilise kontori aadress, uuenda see plokk ja footer ühtse ettevõtteinfo järgi.",
};
