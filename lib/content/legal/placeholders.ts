import type { LegalLocale } from "./types";

/**
 * INTERNAL operator fields — fill before commercial launch.
 * See `LAUNCH_CHECKLIST.md` in this folder.
 *
 * Leave unresolved fields as `null`. Never invent a registry code, VAT number,
 * legal address, phone, or registered-company email for public pages.
 */
export type LaunchOperatorFields = {
  legalEntityName: string | null;
  registryCode: string | null;
  legalAddress: string | null;
  vatNumber: string | null;
  phone: string | null;
  officialEmail: string | null;
  privacyEmail: string | null;
  /**
   * Mailbox used only by the contact form (mailto). Not shown as a registered
   * company's official address until `officialEmail` is set.
   * Confirm the mailbox exists before relying on it.
   */
  contactFormMailto: string;
};

export const LAUNCH_OPERATOR: LaunchOperatorFields = {
  legalEntityName: null,
  registryCode: null,
  legalAddress: null,
  vatNumber: null,
  phone: null,
  officialEmail: null,
  privacyEmail: null,
  contactFormMailto: "info@kvalifits.ee",
};

/** Product name. Not a claim that a legal entity of this name is registered. */
export const PLATFORM_NAME = "Kvalifits";

export const LEGAL_COPY_UPDATED = "2026-08-17";

const BRACKET_PLACEHOLDER = /^\[[^\]]+\]$/;

type ResolvedOperator = {
  legalEntityName: string;
  registryCode: string;
  legalAddress: string;
  vatNumber: string | null;
  phone: string | null;
  officialEmail: string | null;
  privacyEmail: string | null;
};

/** Treat null, blank, and `[placeholder]` strings as unresolved. */
export function resolveOperatorField(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed || BRACKET_PLACEHOLDER.test(trimmed)) return null;
  return trimmed;
}

function resolvedOperator(): ResolvedOperator | null {
  const legalEntityName = resolveOperatorField(LAUNCH_OPERATOR.legalEntityName);
  const registryCode = resolveOperatorField(LAUNCH_OPERATOR.registryCode);
  const legalAddress = resolveOperatorField(LAUNCH_OPERATOR.legalAddress);
  if (!legalEntityName || !registryCode || !legalAddress) return null;

  return {
    legalEntityName,
    registryCode,
    legalAddress,
    vatNumber: resolveOperatorField(LAUNCH_OPERATOR.vatNumber),
    phone: resolveOperatorField(LAUNCH_OPERATOR.phone),
    officialEmail: resolveOperatorField(LAUNCH_OPERATOR.officialEmail),
    privacyEmail: resolveOperatorField(LAUNCH_OPERATOR.privacyEmail),
  };
}

export function isLegalEntityRegistered(): boolean {
  return resolvedOperator() !== null;
}

export function contactFormMailto(): string {
  return resolveOperatorField(LAUNCH_OPERATOR.officialEmail) ?? LAUNCH_OPERATOR.contactFormMailto;
}

export function viaContactPage(locale: LegalLocale): string {
  if (locale === "en") return "the contact form on the Contact page";
  if (locale === "ru") return "форму на странице «Контакты»";
  return "kontaktivormi lehel Kontakt";
}

function emailOrForm(email: string | null, locale: LegalLocale): string {
  if (email) return email;
  return viaContactPage(locale);
}

export function publicPrivacyContact(locale: LegalLocale): string {
  const operator = resolvedOperator();
  const email = operator?.privacyEmail ?? operator?.officialEmail ?? null;
  return emailOrForm(email, locale);
}

export function publicGeneralContact(locale: LegalLocale): string {
  const operator = resolvedOperator();
  return emailOrForm(operator?.officialEmail ?? null, locale);
}

export function controllerParagraph(locale: LegalLocale): string {
  const o = resolvedOperator();
  if (o) {
    const vat =
      o.vatNumber &&
      (locale === "en"
        ? ` VAT number ${o.vatNumber}.`
        : locale === "ru"
          ? ` НДС: ${o.vatNumber}.`
          : ` KMKR ${o.vatNumber}.`);
    if (locale === "en") {
      return `The controller is ${o.legalEntityName}, registry code ${o.registryCode}, located at ${o.legalAddress}.${vat ?? ""} For privacy matters use ${publicPrivacyContact(locale)}.`;
    }
    if (locale === "ru") {
      return `Контролёр: ${o.legalEntityName}, регистрационный код ${o.registryCode}, адрес: ${o.legalAddress}.${vat ?? ""} По вопросам конфиденциальности: ${publicPrivacyContact(locale)}.`;
    }
    return `Vastutavaks töötlejaks on ${o.legalEntityName}, registrikood ${o.registryCode}, asukoht ${o.legalAddress}.${vat ?? ""} Andmekaitse küsimustes kasuta ${publicPrivacyContact(locale)}.`;
  }

  if (locale === "en") {
    return `Kvalifits is a pre-launch skills-based recruitment platform. A legal entity has not yet been registered, so there is no registry code, legal address or VAT number to publish. Until registration, the Kvalifits team processes personal data as needed to operate this site. For privacy matters use ${publicPrivacyContact(locale)}.`;
  }
  if (locale === "ru") {
    return `Kvalifits — предзапусковая платформа рекрутинга на основе навыков. Юридическое лицо ещё не зарегистрировано, поэтому регистрационный код, юридический адрес и номер НДС пока не публикуются. До регистрации команда Kvalifits обрабатывает персональные данные в объёме, необходимом для работы сайта. По вопросам конфиденциальности используйте ${publicPrivacyContact(locale)}.`;
  }
  return `Kvalifits on pädevuspõhine töövahendusplatvorm, mis on praegu eelkäivitusjärgus. Juriidilist isikut ei ole veel äriregistris registreeritud, seega ei avalda me registrikoodi, juriidilist aadressi ega käibemaksukohustuslase numbrit. Kuni registreerimiseni töötleb Kvalifitsi meeskond isikuandmeid selle saidi käitamiseks vajalikus ulatuses. Andmekaitse küsimustes kasuta ${publicPrivacyContact(locale)}.`;
}

export function providerParagraph(locale: LegalLocale): string {
  const o = resolvedOperator();
  if (o) {
    if (locale === "en") {
      return `Kvalifits is a skills-based recruitment platform. The provider is ${o.legalEntityName} (${o.registryCode}), ${o.legalAddress}. A “user” is any person or legal entity that creates an account or otherwise uses the service.`;
    }
    if (locale === "ru") {
      return `Kvalifits — платформа рекрутинга на основе навыков. Поставщик: ${o.legalEntityName} (${o.registryCode}), ${o.legalAddress}. «Пользователь» — любое физическое или юридическое лицо, создавшее учётную запись или иным образом использующее сервис.`;
    }
    return `Kvalifits on pädevuspõhine töövahenduse platvorm. Teenuse pakkuja on ${o.legalEntityName} (${o.registryCode}), ${o.legalAddress}. Kasutaja on iga isik või juriidiline isik, kes loob konto või muul viisil teenust kasutab.`;
  }

  if (locale === "en") {
    return "Kvalifits is a skills-based recruitment platform in a pre-launch phase. A registered legal entity is not yet in place. These terms describe use of the website and related services as they exist today. A “user” is any person or organisation that creates an account or otherwise uses the service.";
  }
  if (locale === "ru") {
    return "Kvalifits — платформа рекрутинга на основе навыков на стадии предзапуска. Зарегистрированного юридического лица пока нет. Настоящие условия описывают использование сайта и связанных сервисов в их текущем виде. «Пользователь» — любое лицо или организация, создающие учётную запись или иным образом использующие сервис.";
  }
  return "Kvalifits on pädevuspõhine töövahenduse platvorm eelkäivitusjärgus. Registreeritud juriidilist isikut veel ei ole. Need tingimused kirjeldavad veebisaidi ja sellega seotud teenuste kasutamist nende praegusel kujul. Kasutaja on iga isik või organisatsioon, kes loob konto või muul viisil teenust kasutab.";
}

export function operatorLeadName(locale: LegalLocale): string {
  const o = resolvedOperator();
  if (o) return o.legalEntityName;
  if (locale === "en") return "the Kvalifits team";
  if (locale === "ru") return "команда Kvalifits";
  return "Kvalifitsi meeskond";
}

export function companyIdentityLines(locale: LegalLocale): string[] {
  const o = resolvedOperator();
  if (o) {
    const lines = [
      o.legalEntityName,
      locale === "en"
        ? `Registry code: ${o.registryCode}`
        : locale === "ru"
          ? `Регистрационный код: ${o.registryCode}`
          : `Registrikood: ${o.registryCode}`,
      locale === "en"
        ? `Address: ${o.legalAddress}`
        : locale === "ru"
          ? `Адрес: ${o.legalAddress}`
          : `Aadress: ${o.legalAddress}`,
    ];
    if (o.vatNumber) {
      lines.push(
        locale === "en" ? `VAT: ${o.vatNumber}` : locale === "ru" ? `НДС: ${o.vatNumber}` : `KMKR: ${o.vatNumber}`,
      );
    }
    if (o.officialEmail) {
      lines.push(
        locale === "en"
          ? `Email: ${o.officialEmail}`
          : locale === "ru"
            ? `Email: ${o.officialEmail}`
            : `E-post: ${o.officialEmail}`,
      );
    }
    if (o.phone) {
      lines.push(
        locale === "en" ? `Phone: ${o.phone}` : locale === "ru" ? `Телефон: ${o.phone}` : `Telefon: ${o.phone}`,
      );
    }
    return lines;
  }

  if (locale === "en") {
    return [
      "Kvalifits is a skills-based recruitment platform in Estonia, currently in a pre-launch phase.",
      "A legal entity has not yet been registered. Registry code, legal address, official company contact and VAT status will be published after registration.",
      `Until then, reach us through ${viaContactPage(locale)}.`,
    ];
  }
  if (locale === "ru") {
    return [
      "Kvalifits — платформа рекрутинга на основе навыков в Эстонии, сейчас на стадии предзапуска.",
      "Юридическое лицо ещё не зарегистрировано. Регистрационный код, юридический адрес, официальный контакт компании и статус НДС будут опубликованы после регистрации.",
      `До этого свяжитесь с нами через ${viaContactPage(locale)}.`,
    ];
  }
  return [
    "Kvalifits on pädevuspõhine töövahendusplatvorm Eestis, praegu eelkäivitusjärgus.",
    "Juriidilist isikut ei ole veel äriregistris registreeritud. Registrikood, juriidiline aadress, ametlik ettevõtte kontakt ja käibemaksustaatus avaldatakse pärast registreerimist.",
    `Seni võta ühendust ${viaContactPage(locale)}.`,
  ];
}

export function companyMissionOperatorSentence(locale: LegalLocale): string {
  const o = resolvedOperator();
  if (o) {
    if (locale === "en") {
      return `${o.legalEntityName} develops and operates the Kvalifits web platform for skills-based recruitment in Estonia, connecting job seekers’ evidence and employers’ requirements.`;
    }
    if (locale === "ru") {
      return `${o.legalEntityName} разрабатывает и эксплуатирует веб-платформу Kvalifits для рекрутинга на основе навыков в Эстонии, связывая подтверждения соискателей с требованиями работодателей.`;
    }
    return `${o.legalEntityName} arendab ja haldab veebiplatvormi Kvalifits, mis toetab pädevuspõhist töövahendust Eestis — tööotsijate oskuste ja tõendite ning tööandjate nõuete kohtumist ühes keskkonnas.`;
  }

  if (locale === "en") {
    return "The Kvalifits team is building the Kvalifits web platform for skills-based recruitment in Estonia, connecting job seekers’ evidence and employers’ requirements. The operating company will be named here once it is registered.";
  }
  if (locale === "ru") {
    return "Команда Kvalifits создаёт веб-платформу Kvalifits для рекрутинга на основе навыков в Эстонии, связывая подтверждения соискателей с требованиями работодателей. Название оператора появится здесь после регистрации юридического лица.";
  }
  return "Kvalifitsi meeskond arendab veebiplatvormi Kvalifits, mis toetab pädevuspõhist töövahendust Eestis — tööotsijate oskuste ja tõendite ning tööandjate nõuete kohtumist ühes keskkonnas. Operaatori juriidiline nimi lisatakse siia pärast ettevõtte registreerimist.";
}

export function legalPrelaunchFootnote(locale: LegalLocale): string {
  if (locale === "en") {
    return "This text describes the current pre-launch service and is not a substitute for legal advice. It will be updated with the registered operator’s details and reviewed before commercial launch.";
  }
  if (locale === "ru") {
    return "Этот текст описывает текущий предзапусковый сервис и не заменяет юридическую консультацию. Перед коммерческим запуском документ будет обновлён данными зарегистрированного оператора и пройдёт юридическую проверку.";
  }
  return "See tekst kirjeldab praegust eelkäivitusjärgus teenust ega asenda õigusnõu. Enne kommertskäivitust täiendatakse see registreeritud operaatori andmetega ja lastakse juristil üle vaadata.";
}

export function dataRequestHowTo(locale: LegalLocale): string {
  if (locale === "en") {
    return `Submit a request through ${publicPrivacyContact(locale)} (subject: “Data protection request”). You can also use the form on the Contact page.`;
  }
  if (locale === "ru") {
    return `Отправьте запрос через ${publicPrivacyContact(locale)} (тема: «Запрос по защите данных»). Можно также воспользоваться формой на странице «Контакты».`;
  }
  return `Esita taotlus ${publicPrivacyContact(locale)} (märksõna „Andmekaitse taotlus“). Võid kasutada ka kontaktivormi lehel Kontakt.`;
}
