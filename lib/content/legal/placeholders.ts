/**
 * Asenda need väärtused päris ettevõtte ja juristi kinnituse järel.
 * Tekstides kasutatakse täpselt neid sulge, et otsing/asendamine oleks lihtne.
 */
export const PL = {
  companyName: "[Ettevõtte nimi]",
  registryCode: "[Registrikood]",
  legalAddress: "[Juriidiline aadress]",
  emailGeneral: "[E-posti aadress]",
  emailPrivacy: "[Andmekaitse kontakt]",
  operatorName: "[Platvormi operaatori nimi]",
  /** Asenda päris numbriga; seni placeholder. */
  phone: "[Telefon — lisame peagi]",
  /** Nt tööpäevad ja eelistatud vastamisaeg. */
  supportHours: "[Tööaeg / vastamisaeg — tulekul]",
  /** Nt LinkedIn või muu ametlik kanal. */
  socialWeb: "[Sotsiaalmeedia / veeb — tulekul]",
} as const;
