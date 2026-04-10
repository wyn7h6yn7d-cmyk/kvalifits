import type { LegalDocument } from "./types";

import { PL } from "./placeholders";

export const privacyET: LegalDocument = {
  path: "/privaatsus",
  metaTitle: "Privaatsuspoliitika",
  metaDescription:
    "Kuidas Kvalifits isikuandmeid kogub, kasutab ja kaitseb. Kasutaja õigused, küpsised ja kontakt.",
  h1: "Privaatsuspoliitika",
  lead: `Käesolev dokument kirjeldab, kuidas ${PL.operatorName} (edaspidi „meie“ või „platvorm“) töötleb isikuandmeid teenuses Kvalifits. Me võtame privaatsust tõsiselt ja töötleme andmeid kooskõlas kehtiva isikuandmete kaitse seadusega ning Euroopa Liidu üldmäärusega (GDPR), kui see rakendub.`,
  lastUpdated: "2026-04-08",
  sections: [
    {
      id: "andmekaitse",
      title: "Andmekaitse eesmärk ja vastutav töötleja",
      paragraphs: [
        `Vastutavaks töötlejaks on ${PL.companyName}, registrikood ${PL.registryCode}, asukoht ${PL.legalAddress}. Andmekaitse ja privaatsusküsimustes võid ühendust võtta aadressil ${PL.emailPrivacy}.`,
        "Kui oled EL-is asuv isik, on sul GDPR-ist tulenevad õigused, sealhulgas õigus tutvuda oma andmetega, nõuda parandamist või kustutamist ning esitada kaebus Andmekaitse Inspektsioonile.",
      ],
    },
    {
      id: "kogutavad-andmed",
      title: "Milliseid andmeid me kogume",
      paragraphs: [
        "Sõltuvalt sellest, kas kasutad platvormi tööotsija või tööandjana (või mõlemana), võime töödelda järgmisi andmekategooriaid:",
      ],
      listItems: [
        "Konto andmed: nimi, e-posti aadress, parooli räsi (mitte parool lahtisel kujul), konto tüüp ja seaded.",
        "Profiiliandmed: tööotsija puhul nt haridus, töökogemus, oskused, keeled, soovitud rollid; tööandja puhul ettevõtte nimi, kontaktisik, kuulutuste sisu.",
        "Dokumendid ja tõendid: üleslaaditud sertifikaadid, load või muud failid, mida otsustad platvormi kaudu jagada.",
        "Suhtlusandmed: platvormi sees saadetud sõnumid või taotlused, kui selline funktsioon on saadaval.",
        "Tehnilised andmed: IP-aadress, brauseri tüüp, seadme tüüp, logid (nt sisselogimise aeg, veateated), küpsiste kaudu kogutud teave vastavalt meie küpsiste poliitikale.",
        "Kasutusstatistika: lehtede vaatamised ja klõpsud, kui kasutame analüütikat (ainult vastavalt sinu nõusolekule või seaduslikul alusel, nagu poliitikas kirjas).",
      ],
    },
    {
      id: "kasutus",
      title: "Milleks me andmeid kasutame",
      paragraphs: [
        "Töötleme isikuandmeid üksnes selgelt määratletud eesmärkidel:",
      ],
      listItems: [
        "Konto loomine, autentimine ja turvalisus (lepingu täitmine ja õigustatud huvi).",
        "Platvormi funktsioonide pakkumine: profiilid, kuulutused, sobitamine, teavitused (lepingu täitmine).",
        "Kvaliteedi parandamine, tehniline tugi ja veaotsing (õigustatud huvi või lepingu täitmine).",
        "Õiguslike kohustuste täitmine, sh andmete säilitamine kui seadus seda nõuab.",
        "Turundus e-posti teel ainult juhul, kui oled andnud eraldi nõusoleku või kui see on lubatud seaduse järgi.",
      ],
    },
    {
      id: "oiguslik-alus",
      title: "Õiguslik alus töötlusele",
      paragraphs: [
        "Töötluse aluseks võib olla: sinu ja meie vahelise teenuslepingu täitmine; meie õigustatud huvi (nt platvormi turvalisus ja arendus), mis ei kaalu üles sinu õigusi; sinu nõusolek (nt mitte-hädavajalikud küpsised või otseturundus); või juriidiline kohustus.",
      ],
    },
    {
      id: "sailitamine",
      title: "Kui kaua andmeid säilitatakse",
      paragraphs: [
        "Säilitame andmeid ainult nii kaua, kui see on eesmärgi täitmiseks vajalik, välja arvatud juhul, kui seadus nõuab pikemat säilitamist (nt raamatupidamisnõuded).",
        "Kui sulged konto, kustutame või anonüümime sinu isikuandmed mõistliku aja jooksul, välja arvatud andmed, mida peame seaduse alusel alles hoidma või mis on vajalik vaidluste lahendamiseks.",
      ],
    },
    {
      id: "edastamine",
      title: "Kellele andmeid edastatakse",
      paragraphs: [
        "Me ei müü sinu isikuandmeid kolmandatele osapooltele. Andmeid võidakse jagada piiratud ulatuses:",
      ],
      listItems: [
        "Teenusepakkujatega (nt pilveteenus, e-posti saatmine), kellega on sõlmitud lepingud ja kes töötlevad andmeid meie juhiste järgi.",
        "Kui oled tööotsija, võivad sinu profiiliandmed (sinu valikul või vastavalt seadistustele) olla nähtavad tööandjatele, kes kasutavad platvormi — töövahenduse eesmärgil.",
        "Õigusasutustele, kui seadus seda nõuab või kaitsemaks õigustatud huve.",
      ],
    },
    {
      id: "kolmandad-riigid",
      title: "Andmete ülekanne väljapoole EMP-i",
      paragraphs: [
        "Kui kasutame teenusepakkujaid väljaspool Euroopa Majanduspiirkonda, tagame sobivad kaitsemeetmed (nt standardlepingutingimused või komisjoni otsused), kui see on nõutav.",
      ],
    },
    {
      id: "oigused",
      title: "Sinu õigused",
      paragraphs: [
        "Sul on õigus tutvuda oma isikuandmetega, nõuda nende parandamist või kustutamist (tingimustel, mida piirab seadus), piirata töötlust, esitada vastuväiteid töötlusele õigustatud huvi alusel ning kui töötlus põhineb nõusolekul — nõusolek tagasi võtta.",
        "Täpsemad juhised, kuidas taotleda koopiaid, kustutamist või muudatust, leiad lehelt „Andmesubjekti õigused ja kustutamine“ (/andmekaitse). Taotluse võid saata aadressile " +
          PL.emailPrivacy +
          ".",
      ],
    },
    {
      id: "kupsised",
      title: "Küpsised ja analüütika",
      paragraphs: [
        "Kasutame küpsiseid platvormi toimimiseks, eelistuste meeldejätmiseks ja — sinu nõusolekul — statistika jaoks. Üksikasjalik kirjeldus on dokumendis „Küpsiste poliitika“ (/kupsised).",
      ],
    },
    {
      id: "turvalisus",
      title: "Turvalisus",
      paragraphs: [
        "Rakendame tehnilisi ja organisatsioonilisi meetmeid (sh krüpteerimine ühenduses, juurdepääsukontroll, turvauuendused) andmete kaitsmiseks loata juurdepääsu, kaotsimineku või muutmise eest. Absoluutset turvalisust ei saa internetiteenustes garanteerida.",
      ],
    },
    {
      id: "muudatused",
      title: "Poliitika muutmine",
      paragraphs: [
        "Võime seda poliitikat aeg-ajalt uuendada. Oluliste muudatuste korral anname teada platvormi kaudu või e-posti teel, kui see on mõistlik. Jätkates teenuse kasutamist pärast muudatuste jõustumist, loetakse, et oled uuendustega tutvunud; kui nõusolek on vajalik, küsime selle eraldi.",
      ],
    },
    {
      id: "kontakt",
      title: "Kontakt",
      paragraphs: [
        `Privaatsus- ja andmekaitseküsimustes: ${PL.emailPrivacy}. Üldkontakt: ${PL.emailGeneral}.`,
      ],
    },
  ],
  footnote:
    "See dokument on ettevalmistatud üldiseks teabeks ja ei asenda individuaalset õigusnõustamist. Enne avalikku kasutamist peaks teksti üle vaatama jurist ning täitma kõik kohustuslikud ettevõtteandmed.",
};
