import type { LegalDocument, LegalLocale } from "@/lib/content/legal/types";
import { PL } from "@/lib/content/legal/placeholders";
import {
  COOKIE_CATEGORY_META,
  COOKIE_CONSENT_VERSION,
  activeCookieEntries,
  activeOptionalCategories,
  categoryIsActiveInProduct,
  cookieConsentUiRequired,
  type CookieCategoryId,
  type CookieLocaleCopy,
} from "@/lib/cookies/config";

function pick(copy: CookieLocaleCopy, locale: LegalLocale): string {
  return copy[locale] ?? copy.et;
}

const chrome: Record<
  LegalLocale,
  {
    metaTitle: string;
    metaDescription: string;
    h1: string;
    lead: string;
    whatTitle: string;
    whatBody: string;
    listTitle: string;
    listIntro: string;
    manageTitle: string;
    manageBodyEssentialOnly: string;
    manageBodyWithConsent: string;
    privacyTitle: string;
    privacyBody: string;
    updatesTitle: string;
    updatesBody: string;
    inactiveNote: string;
    kindCookie: string;
    kindStorage: string;
    kindScript: string;
  }
> = {
  et: {
    metaTitle: "Küpsiste poliitika",
    metaDescription:
      "Milliseid küpsiseid ja sarnaseid tehnoloogiaid Kvalifits tegelikult kasutab ning kuidas nõusolekut hallata.",
    h1: "Küpsiste poliitika",
    lead: `See poliitika kirjeldab ${PL.operatorName} tegelikku küpsiste ja sarnaste tehnoloogiate kasutust platvormil Kvalifits. Isikuandmete töötlemine: privaatsuspoliitika (/privaatsus).`,
    whatTitle: "Mis on küpsised",
    whatBody:
      "Küpsis on väike tekstifail, mille brauser võib seadmesse salvestada. Kasutame ka sarnaseid tehnoloogiaid (nt kohalik salvesti või analüütikaskriptid), mida käsitleme siin samas poliitikas.",
    listTitle: "Mida me praegu kasutame",
    listIntro:
      "Alljärgnev nimekiri tuleb samast tehnilisest konfiguratsioonist, mida kasutab nõusolekuliides. Kui kategooriat tootes ei kasutata, ei küsita selle kohta turunduslikku nõusolekut.",
    manageTitle: "Kuidas valikut hallata",
    manageBodyEssentialOnly:
      "Praegu kasutame ainult hädavajalikke auth/seansi ja keele küpsiseid. Eraldi analüütika- või turundusnõusoleku riba ei kuvata, sest valikulisi skripte ei laadita.",
    manageBodyWithConsent:
      "Analüütika (ja tulevikus turundus, kui see aktiveeritakse) laaditakse alles pärast nõusolekut. Saad valida „Nõustun“, „Keeldun“ või „Seaded“. Valikut saad hiljem muuta jaluses lingiga „Küpsiste seaded“ või küpsisepoliitika lehel.",
    privacyTitle: "Seos privaatsuspoliitikaga",
    privacyBody:
      "Isikuandmete töötlemine on kirjeldatud privaatsuspoliitikas (/privaatsus). Küsimused: " +
      PL.emailPrivacy +
      ".",
    updatesTitle: "Poliitika uuendamine",
    updatesBody:
      "Kui tehniline küpsiste konfiguratsioon muutub, uuendatakse seda dokumenti ja nõusoleku versiooni. Kehtiv versioon: consent v" +
      String(COOKIE_CONSENT_VERSION) +
      ".",
    inactiveNote: "Seda kategooriat praegu ei kasutata.",
    kindCookie: "küpsis",
    kindStorage: "kohalik salvesti",
    kindScript: "skript / sarnane tehnoloogia",
  },
  en: {
    metaTitle: "Cookie policy",
    metaDescription:
      "Which cookies and similar technologies Kvalifits actually uses, and how to manage consent.",
    h1: "Cookie policy",
    lead: `This policy describes ${PL.operatorName}'s actual use of cookies and similar technologies on Kvalifits. Personal data: privacy policy (/en/privaatsus).`,
    whatTitle: "What cookies are",
    whatBody:
      "A cookie is a small text file a browser may store on your device. We also use similar technologies (e.g. local storage or analytics scripts), covered by this policy.",
    listTitle: "What we use today",
    listIntro:
      "The list below comes from the same technical configuration as the consent UI. If a category is not used in the product, we do not ask for marketing-style consent for it.",
    manageTitle: "Managing your choice",
    manageBodyEssentialOnly:
      "We currently use only strictly necessary auth/session and language cookies. We do not show a separate analytics/marketing consent banner because optional scripts are not loaded.",
    manageBodyWithConsent:
      "Analytics (and marketing if activated later) load only after consent. You can choose Accept, Decline, or Settings. You can change your choice later via “Cookie settings” in the footer or on this page.",
    privacyTitle: "Privacy policy",
    privacyBody:
      "Processing of personal data is described in the privacy policy (/en/privaatsus). Questions: " +
      PL.emailPrivacy +
      ".",
    updatesTitle: "Updates",
    updatesBody:
      "When the technical cookie configuration changes, this document and the consent version are updated. Current consent version: v" +
      String(COOKIE_CONSENT_VERSION) +
      ".",
    inactiveNote: "This category is not currently used.",
    kindCookie: "cookie",
    kindStorage: "local storage",
    kindScript: "script / similar technology",
  },
  ru: {
    metaTitle: "Политика cookie",
    metaDescription:
      "Какие cookie и схожие технологии реально использует Kvalifits и как управлять согласием.",
    h1: "Политика cookie",
    lead: `Этот документ описывает фактическое использование cookie и схожих технологий ${PL.operatorName} на Kvalifits. Персональные данные: политика конфиденциальности (/ru/privaatsus).`,
    whatTitle: "Что такое cookie",
    whatBody:
      "Cookie — небольшой текстовый файл, который браузер может сохранить на устройстве. Мы также используем схожие технологии (локальное хранилище или скрипты аналитики), которые описаны здесь.",
    listTitle: "Что мы используем сейчас",
    listIntro:
      "Список ниже берётся из той же технической конфигурации, что и интерфейс согласия. Если категория в продукте не используется, мы не запрашиваем для неё маркетинговое согласие.",
    manageTitle: "Как управлять выбором",
    manageBodyEssentialOnly:
      "Сейчас мы используем только строго необходимые cookie для auth/сессии и языка. Отдельный баннер согласия для аналитики/маркетинга не показывается, потому что необязательные скрипты не загружаются.",
    manageBodyWithConsent:
      "Аналитика (и маркетинг, если будет включён позже) загружается только после согласия. Можно выбрать «Согласен», «Отказаться» или «Настройки». Позже выбор можно изменить через «Настройки cookie» в подвале или на этой странице.",
    privacyTitle: "Политика конфиденциальности",
    privacyBody:
      "Обработка персональных данных описана в политике конфиденциальности (/ru/privaatsus). Вопросы: " +
      PL.emailPrivacy +
      ".",
    updatesTitle: "Обновления",
    updatesBody:
      "При изменении технической конфигурации cookie этот документ и версия согласия обновляются. Текущая версия согласия: v" +
      String(COOKIE_CONSENT_VERSION) +
      ".",
    inactiveNote: "Эта категория сейчас не используется.",
    kindCookie: "cookie",
    kindStorage: "локальное хранилище",
    kindScript: "скрипт / схожая технология",
  },
};

function kindLabel(
  kind: "cookie" | "local_storage" | "script",
  locale: LegalLocale,
  c: (typeof chrome)[LegalLocale]
): string {
  if (kind === "local_storage") return c.kindStorage;
  if (kind === "script") return c.kindScript;
  return c.kindCookie;
}

function buildCategoryListItems(locale: LegalLocale, category: CookieCategoryId): string[] {
  const c = chrome[locale];
  const entries = activeCookieEntries().filter((e) => e.category === category);
  if (!entries.length) {
    return [`${pick(COOKIE_CATEGORY_META[category].label, locale)}: ${c.inactiveNote}`];
  }
  return entries.map((e) => {
    const purpose = pick(e.purpose, locale);
    return `${e.name} (${e.provider}; ${kindLabel(e.kind, locale, c)}) — ${purpose}`;
  });
}

/** Cookie policy document built from the live cookie config (same as consent UI). */
export function buildCookiePolicy(locale: LegalLocale): LegalDocument {
  const c = chrome[locale];
  const needsConsent = cookieConsentUiRequired();
  const optional = activeOptionalCategories();

  const categoryOrder: CookieCategoryId[] = ["necessary", "analytics", "marketing"];
  const listItems: string[] = [];
  for (const cat of categoryOrder) {
    const meta = COOKIE_CATEGORY_META[cat];
    const active = categoryIsActiveInProduct(cat);
    listItems.push(
      `${pick(meta.label, locale)}${active ? "" : ` (${c.inactiveNote})`}: ${pick(meta.description, locale)}`
    );
    for (const line of buildCategoryListItems(locale, cat)) {
      listItems.push(`• ${line}`);
    }
  }

  return {
    path: "/kupsised",
    metaTitle: c.metaTitle,
    metaDescription: c.metaDescription,
    h1: c.h1,
    lead: c.lead,
    lastUpdated: "2026-08-16",
    sections: [
      {
        id: "mis-on",
        title: c.whatTitle,
        paragraphs: [c.whatBody],
      },
      {
        id: "tegelik-nimekiri",
        title: c.listTitle,
        paragraphs: [
          c.listIntro,
          needsConsent
            ? locale === "en"
              ? `Consent is required for: ${optional.join(", ")}.`
              : locale === "ru"
                ? `Согласие требуется для: ${optional.join(", ")}.`
                : `Nõusolek on vajalik kategooriatele: ${optional.join(", ")}.`
            : locale === "en"
              ? "No optional analytics or marketing technologies are active."
              : locale === "ru"
                ? "Необязательные аналитика и маркетинг не активны."
                : "Valikulisi analüütika- ega turundustehnoloogiaid ei ole aktiivsed.",
        ],
        listItems,
      },
      {
        id: "hallamine",
        title: c.manageTitle,
        paragraphs: [needsConsent ? c.manageBodyWithConsent : c.manageBodyEssentialOnly],
      },
      {
        id: "privaatsus-viide",
        title: c.privacyTitle,
        paragraphs: [c.privacyBody],
      },
      {
        id: "uuendused",
        title: c.updatesTitle,
        paragraphs: [c.updatesBody],
      },
    ],
  };
}
