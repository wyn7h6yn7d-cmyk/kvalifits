import type { CompanyPageContent } from "./types";

import { PL } from "./placeholders";

export const companyRU: CompanyPageContent = {
  path: "/ettevote",
  metaTitle: "Компания",
  metaDescription:
    "Сведения об операторе платформы Kvalifits — рекрутинг на основе навыков в Эстонии.",
  h1: "Сведения о компании",
  lead: "Ключевая информация о платформе Kvalifits.",
  lastUpdated: "2026-04-13",
  sections: [
    {
      id: "operaator",
      title: "Компания",
      paragraphs: [
        "Kvalifits OÜ",
        `Регистрационный код: ${PL.registryCode}`,
        `Адрес: ${PL.legalAddress}`,
        "Общий контакт: [email]",
        "Телефон: [телефон]",
      ],
    },
    {
      id: "kontakt-ettevote",
      title: "Конфиденциальность",
      paragraphs: ["Учётная запись или персональные данные: [email]"],
    },
    {
      id: "eesmark",
      title: "Миссия",
      paragraphs: [
        "Kvalifits стремится снизить шум на рынке труда, делая проверяемые навыки видимыми, проясняя соответствие и поддерживая более справедливый найм. Платформа развивается с учётом отзывов пользователей.",
        "Kvalifits OÜ разрабатывает и эксплуатирует веб-платформу Kvalifits для рекрутинга на основе навыков в Эстонии, связывая подтверждения соискателей с требованиями работодателей.",
      ],
    },
  ],
};
