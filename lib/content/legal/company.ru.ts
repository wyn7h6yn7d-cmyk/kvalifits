import type { CompanyPageContent } from "./types";

import {
  LEGAL_COPY_UPDATED,
  companyIdentityLines,
  companyMissionOperatorSentence,
  publicPrivacyContact,
} from "./placeholders";

export const companyRU: CompanyPageContent = {
  path: "/ettevote",
  metaTitle: "Платформа",
  metaDescription:
    "О платформе Kvalifits — рекрутинг на основе навыков в Эстонии.",
  h1: "Платформа",
  lead: "Kvalifits — платформа рекрутинга на основе навыков. Данные юридического лица будут опубликованы после регистрации.",
  lastUpdated: LEGAL_COPY_UPDATED,
  sections: [
    {
      id: "operaator",
      title: "Оператор",
      paragraphs: companyIdentityLines("ru"),
    },
    {
      id: "kontakt-ettevote",
      title: "Конфиденциальность",
      paragraphs: [`Учётная запись или персональные данные: ${publicPrivacyContact("ru")}.`],
    },
    {
      id: "eesmark",
      title: "Миссия",
      paragraphs: [
        "Kvalifits стремится снизить шум на рынке труда, делая проверяемые навыки видимыми, проясняя соответствие и поддерживая более справедливый найм. Платформа развивается с учётом отзывов пользователей.",
        companyMissionOperatorSentence("ru"),
      ],
    },
  ],
};
