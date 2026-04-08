import type { LegalDocument } from "./types";

import { PL } from "./placeholders";

export const dataRightsET: LegalDocument = {
  path: "/andmekaitse",
  metaTitle: "Andmesubjekti õigused ja andmete kustutamine",
  metaDescription:
    "Kuidas taotleda oma andmete koopiat, parandamist või kustutamist Kvalifitsis. Vastamise tähtajad ja kontakt.",
  h1: "Andmesubjekti õigused ja andmete kustutamine",
  lead: `See leht aitab sul kasutada õigusi, mis sul on oma isikuandmete suhtes teenuses Kvalifits, mida haldab ${PL.operatorName}.`,
  lastUpdated: "2026-04-08",
  sections: [
    {
      id: "oigused-ulevaade",
      title: "Millised õigused sul on",
      paragraphs: [
        "Sõltuvalt olukorrast võivad sul olla järgmised õigused (sh GDPR kohaldumisel):",
      ],
      listItems: [
        "Õigus saada kinnitus, kas sinu kohta töödeldakse andmeid, ja saada ligipääs neile.",
        "Õigus nõuda ebatäpsuste parandamist.",
        "Õigus nõuda kustutamist („õigus olla unustatud“), kui puudub enam õiguslik alus töötluseks või kui töötlus oli ebaseaduslik.",
        "Õigus piirata töötlust teatud tingimustel.",
        "Õigus esitada vastuväiteid töötlusele, mis põhineb õigustatud huvil.",
        "Õigus andmete ülekantavusele, kui töötlus põhineb nõusolekul või lepingul ja töötlus on automatiseeritud.",
        "Õigus esitada kaebus Andmekaitse Inspektsioonile (Eesti).",
      ],
    },
    {
      id: "kuidas-taotleda",
      title: "Kuidas taotlus esitada",
      paragraphs: [
        `Saada e-kiri aadressile ${PL.emailPrivacy} märgis „Andmekaitse taotlus“ või kasuta kontaktivormi lehel /kontakt.`,
        "Palun lisa: oma nimi, e-post (kasutatud kontol), taotluse liik (koopia, parandus, kustutamine jne) ja vajadusel konto tuvastamiseks vajalikud andmed. Võime paluda isikut tõendada, et kaitsta sinu andmeid volitamata päringute eest.",
      ],
    },
    {
      id: "vastamisajad",
      title: "Kui kiiresti vastame",
      paragraphs: [
        "Eesmärgiga vastame taotlustele ühe kuu jooksul alates taotluse saamisest. Keerukate taotluste korral võime seda tähtaega kahe kuu võrra pikendada, teatades sulle põhjusega.",
      ],
    },
    {
      id: "kustutamine",
      title: "Konto ja andmete kustutamine",
      paragraphs: [
        "Konto sulgemisel kustutame või anonüümime isikuandmed, välja arvatud juhud, kus säilitamine on seadusega nõutud (nt raamatupidamine) või kus meil on õigustatud huvi vaidluste lahendamiseks (piiratud aeg).",
        "Mõned andmed võivad jääda koondstatistika kujul, kus sind ei ole võimalik tuvastada.",
      ],
    },
    {
      id: "muutmine",
      title: "Andmete muutmine ise",
      paragraphs: [
        "Paljusid profiiliandmeid saad muuta otse platvormi seadetest, kui funktsioon on saadaval. Kui midagi ei saa ise muuta, kirjuta meile.",
      ],
    },
    {
      id: "kontakt",
      title: "Kontakt",
      paragraphs: [
        `Andmekaitse päringud: ${PL.emailPrivacy}. Üldkontakt: ${PL.emailGeneral}.`,
      ],
    },
  ],
  footnote:
    "Täpsed menetlused peaksid vastama tegelikule IT-lahendusele ja juriidilisele ülevaatusele.",
};
