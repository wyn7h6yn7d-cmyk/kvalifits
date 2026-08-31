import type { ContactPageContent } from "./types";

import {
  LEGAL_COPY_UPDATED,
  companyIdentityLines,
  contactFormMailto,
  legalPrelaunchFootnote,
} from "./placeholders";

export const contactRU: ContactPageContent = {
  path: "/kontakt",
  metaTitle: "Контакты",
  metaDescription: "Свяжитесь с нами — отвечаем в рабочие дни.",
  h1: "Контакты",
  lead: "Вопрос о Kvalifits? Используйте форму ниже. Ответим в рабочие дни.",
  lastUpdated: LEGAL_COPY_UPDATED,
  blocks: [
    {
      title: "Kvalifits",
      lines: companyIdentityLines("ru"),
      icon: "building2",
      span: 2,
    },
    {
      title: "Сайт",
      lines: ["kvalifits.ee"],
      icon: "share2",
      span: 2,
    },
  ],
  blocksAside: {
    title: "Как связаться",
    lead: "Официальный email, телефон и адрес компании будут опубликованы после регистрации юридического лица. Пока используйте форму.",
  },
  form: {
    nameLabel: "Имя",
    emailLabel: "Email",
    subjectLabel: "Тема",
    messageLabel: "Сообщение",
    submitLabel: "Открыть почту",
    privacyHint: "Контакты используем только для ответа. Подробнее: /ru/privaatsus.",
    successNote: "Откроется почта — пробегитесь глазами перед отправкой.",
  },
  formMailTo: contactFormMailto(),
  footnote: legalPrelaunchFootnote("ru"),
};
