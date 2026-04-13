/**
 * Controlled synonym / concept families for matching.
 *
 * How to extend:
 * - Add a new key (canonical concept id) and a short list of variants.
 * - Keep variants short; prefer token-like strings and common phrase forms.
 * - Avoid overly broad concepts (prevents false positives).
 *
 * Notes:
 * - Canonical ids are stable and used in scoring/debug/explanations.
 * - Variants are normalized by the normalization pipeline before lookup.
 */
export const SYNONYM_FAMILIES: Record<string, string[]> = {
  // Electrical / electrician related (ET)
  elektrik: [
    "elektrik",
    "elektritoo",
    "elektritood",
    "elektripaigaldaja",
    "elektripaigaldus",
    "elektrialane",
    "elektrialane paigaldus",
  ],

  // Sheet metal / metalwork related (ET)
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
  ],

  // Warehouse / logistics (ET)
  ladu: ["ladu", "laotööline", "laotöötaja", "laotoo", "laotöö", "komplekteerija", "logistika", "laotöö"],

  // Driving / transport (ET)
  juht: ["juht", "autojuht", "veokijuht", "kuller", "transport", "vedu"],

  // B-category driver's license (ET + EN) — distinct from electrical "b-padev"
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
  ],

  // Installation / assembly (ET + common loanwords)
  paigaldus: ["paigaldus", "paigaldaja", "monteerija", "koostaja", "montaaž", "montaa", "installer", "install"],

  // Ventilation / HVAC
  ventilatsioon: ["ventilatsioon", "ventilatsiooni", "hvac", "kliima", "kliimaseade", "kliimaseadmed"],

  // Construction
  ehitus: ["ehitus", "ehitaja", "ehitustoo", "ehitustood"],

  // CAD / drawing / design
  cad: ["cad", "autocad", "auto-cad", "joonestamine", "joonestaja", "joonised"],

  // Certificates / qualifications (ET)
  "a-padev": ["a-pädevus", "a-padev", "apadev", "apädevus"],
  "b-padev": ["b-pädevus", "b-padev", "bpadev", "bpädevus", "elektrialane pädevus", "padevustunnistus"],
  kutse: ["kutse", "kutsetunnistus", "kutsetase", "kutse tase 4", "tase 4", "kutse4", "tase4"],
  toohutus: ["tööohutus", "toohutus", "ohutus", "ohutuskoolitus"],

  // Work format / job type wording (ET + EN)
  remote: ["kaugtöö", "kaugtoo", "remote", "distants", "wfh", "work from home"],
  hybrid: ["hübriid", "hybriid", "hybrid"],
  on_site: ["kohapeal", "kohapealne", "on-site", "onsite", "on site"],
  full_time: ["täistööaeg", "taistooaeg", "full-time", "full time"],
  part_time: ["osalise tööajaga", "osaline tööaeg", "part-time", "part time"],
};

