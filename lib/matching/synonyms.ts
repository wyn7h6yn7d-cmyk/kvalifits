/**
 * Controlled synonym / concept families for matching (ET + EN + RU where useful).
 *
 * - Normalization keeps Unicode letters (incl. Cyrillic); Latin combining marks are stripped.
 * - Lookup is per token — prefer one word per variant (multi-word lines only help if that whole string is stored as a single tag).
 * - Canonical keys are stable IDs for scoring / explanations.
 */
export const SYNONYM_FAMILIES: Record<string, string[]> = {
  // Electrical / electrician
  elektrik: [
    "elektrik",
    "elektritoo",
    "elektritood",
    "elektripaigaldaja",
    "elektripaigaldus",
    "elektrialane",
    "elektrialane paigaldus",
    "electrician",
    "sparky",
    "электрик",
    "электромонтер",
    "электромонтажник",
    "электромонтаж",
  ],

  // Sheet metal / metalwork
  plekksepp: [
    "plekksepp",
    "plekitood",
    "plekitoo",
    "plekidetail",
    "plekidetailid",
    "ventilatsiooniplekk",
    "metallitooline",
    "metallitööline",
    "metallitood",
    "metallitoo",
    "metallitöö",
    "tinsmith",
    "sheetmetal",
    "жестянщик",
    "кузнец",
  ],

  // Warehouse / logistics
  ladu: [
    "ladu",
    "laotööline",
    "laotöötaja",
    "laotoo",
    "laotöö",
    "komplekteerija",
    "logistika",
    "warehouse",
    "picker",
    "logistics",
    "склад",
    "комплектовщик",
    "логистика",
    "кладовщик",
  ],

  // Driving / transport
  juht: [
    "juht",
    "autojuht",
    "veokijuht",
    "kuller",
    "transport",
    "vedu",
    "driver",
    "courier",
    "trucking",
    "водитель",
    "шофер",
    "курьер",
    "дальнобойщик",
  ],

  // B-category driver's license — distinct from electrical "b-padev"
  "b-juhiluba": [
    "b-kategooria juhiluba",
    "b kategooria juhiluba",
    "bkategooria juhiluba",
    "b-kategooria",
    "b kategooria",
    "juhiluba",
    "autojuhiluba",
    "b-kat",
    "b kat",
    "drivers license b",
    "driver license b",
    "category b license",
    "category b",
    "b licence",
    "class b license",
  ],

  // Installation / assembly
  paigaldus: [
    "paigaldus",
    "paigaldaja",
    "monteerija",
    "koostaja",
    "montaaž",
    "montaa",
    "installer",
    "install",
    "assembler",
    "fitter",
    "монтаж",
    "монтажник",
    "установщик",
    "сборщик",
  ],

  // Ventilation / HVAC
  ventilatsioon: [
    "ventilatsioon",
    "ventilatsiooni",
    "hvac",
    "kliima",
    "kliimaseade",
    "kliimaseadmed",
    "ventilation",
    "вентиляция",
    "климат",
  ],

  // Construction
  ehitus: [
    "ehitus",
    "ehitaja",
    "ehitustoo",
    "ehitustood",
    "construction",
    "builder",
    "строительство",
    "строитель",
    "прораб",
  ],

  // CAD / drawing
  cad: [
    "cad",
    "autocad",
    "auto-cad",
    "joonestamine",
    "joonestaja",
    "joonised",
    "drafting",
    "чертежник",
    "автокад",
  ],

  // Certificates / qualifications
  "a-padev": ["a-pädevus", "a-padev", "apadev", "apädevus"],
  "b-padev": [
    "b-pädevus",
    "b-padev",
    "bpadev",
    "bpädevus",
    "elektrialane pädevus",
    "padevustunnistus",
  ],
  kutse: [
    "kutse",
    "kutsetunnistus",
    "kutsetase",
    "kutse tase 4",
    "tase 4",
    "kutse4",
    "tase4",
  ],
  toohutus: ["tööohutus", "toohutus", "ohutus", "ohutuskoolitus"],

  // Work format / job type
  remote: [
    "kaugtöö",
    "kaugtoo",
    "remote",
    "distants",
    "wfh",
    "work from home",
    "удаленка",
    "удалёнка",
  ],
  hybrid: ["hübriid", "hybriid", "hybrid", "гибрид"],
  on_site: ["kohapeal", "kohapealne", "on-site", "onsite", "on site"],
  full_time: ["täistööaeg", "taistooaeg", "full-time", "full time"],
  part_time: ["osalise tööajaga", "osaline tööaeg", "part-time", "part time"],
};
