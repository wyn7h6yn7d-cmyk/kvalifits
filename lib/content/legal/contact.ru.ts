import type { ContactPageContent } from "./types";

import { PL } from "./placeholders";

export const contactRU: ContactPageContent = {
  path: "/kontakt",
  metaTitle: "Контакты",
  metaDescription: "Свяжитесь с нами — отвечаем в рабочие дни.",
  h1: "Контакты",
  lead: "Вопрос о платформе или просто хотите написать? Ответим в рабочие дни как можно скорее.",
  lastUpdated: "2026-04-13",
  blocks: [
    {
      title: "Компания",
      lines: [
        "Kvalifits OÜ",
        `Регистрационный код: ${PL.registryCode}`,
        `Адрес: ${PL.legalAddress}`,
        "Общий контакт: [email]",
        "Телефон: [телефон]",
      ],
      icon: "building2",
      span: 2,
    },
    {
      title: "Сайт и соцсети",
      lines: ["Сайт: kvalifits.ee", "Соцсети — скоро добавим"],
      icon: "share2",
      span: 2,
    },
  ],
  blocksAside: {
    title: "Контактные данные",
    lead: "Компания и сайт — при необходимости обновим сведения.",
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
  formMailTo: "info@kvalifits.ee",
};
