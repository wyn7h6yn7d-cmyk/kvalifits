import type { LegalDocument } from "./types";

import { PL } from "./placeholders";

export const termsET: LegalDocument = {
  path: "/tingimused",
  metaTitle: "Kasutustingimused",
  metaDescription:
    "Kvalifitsi platvormi kasutamise reeglid: kontod, rollid, vastutus, teenuse muutmine ja kontakt.",
  h1: "Kasutustingimused",
  lead: `Need tingimused kehtivad veebiplatvormi Kvalifits kasutamisele, mida pakub ${PL.operatorName}. Platvormi kasutades kinnitad, et oled tingimustega tutvunud ja nõustud nendega. Kui ei nõustu, ära kasuta teenust.`,
  lastUpdated: "2026-04-08",
  sections: [
    {
      id: "teenus",
      title: "Teenus ja lepingupooled",
      paragraphs: [
        `Kvalifits on pädevuspõhine töövahenduse platvorm. Teenuse pakkuja on ${PL.companyName} (${PL.registryCode}), ${PL.legalAddress}. Kasutaja on iga isik või juriidiline isik, kes loob konto või muul viisil teenust kasutab.`,
      ],
    },
    {
      id: "kes-voib",
      title: "Kes võib platvormi kasutada",
      paragraphs: [
        "Platvormi võivad kasutada vähemalt 18-aastased või seadusliku esindaja nõusolekul nooremad isikud vastavalt kohaldatavale seadusele. Tööandjana võid registreeruda ettevõtte volitatud esindajana.",
        "Peab esitama tõese kontakt- ja kontoandmeid. Valeandmete või kellegi teise identiteedi kasutamine on keelatud.",
      ],
    },
    {
      id: "konto",
      title: "Kasutajakonto",
      paragraphs: [
        "Konto loomiseks tuleb läbida registreerimisprotsess ja kinnitada, et nõustud nende tingimuste ja privaatsuspoliitikaga.",
        "Oled vastutav oma kasutajanime ja parooli saladuses hoidmise eest. Kui kahtlustad volitamata kasutust, teavita meid viivitamata.",
        "Üks isik ei tohi luua mitut kontot eesmärgiga petta, manipuleerida sobitustega või kõrvaldada piiranguid.",
      ],
    },
    {
      id: "rollid",
      title: "Tööandja ja tööotsija rollid",
      paragraphs: [
        "Tööotsija rollis saad luua profiili, esitleda oskusi ja tõendeid ning taotleda või vastata võimalustele vastavalt platvormi funktsioonidele.",
        "Tööandja rollis saad avaldada töökuulutusi, määratleda nõudeid ja vaadata kandidaate vastavalt funktsioonidele.",
        "Sama kasutaja võib olla mõlemas rollis, kui platvorm seda võimaldab; iga rolliga kaasnevad vastavuses olevad kohustused.",
      ],
    },
    {
      id: "sisu-vastutus",
      title: "Kasutaja vastutus sisestamise eest",
      paragraphs: [
        "Oled ainuvastutav kõigi platvormile sisestatud andmete, tekstide, failide ja muu sisu eest. See ei tohi rikkuda kolmandate isikute õigusi ega kehtivat seadust (sh diskrimineerimiskeeld, isikuandmete kaitse, autoriõigus).",
        "Keelatud on solvav, eksitav, pahatahtlik või ebaseaduslik sisu, sh pahavara levitamine või spämm.",
      ],
    },
    {
      id: "sertifikaadid",
      title: "Sertifikaatide ja kvalifikatsioonide õigsus",
      paragraphs: [
        "Kinnitad, et esitatud sertifikaadid, load ja muud tõendid kuuluvad sulle või sul on õigus neid esitada. Oled teadlik, et valeandmete esitamine võib kaasa tuua konto sulgemise ja võimalikud õiguslikud tagajärjed.",
        "Platvorm võib pakkuda mehhanisme tõendite kontrollimiseks või märgistamiseks, kuid see ei asenda tööandja või kolmanda osapoole oma kontrolli. Me ei garanteeri kõigi tõendite automaatset õigsust.",
      ],
    },
    {
      id: "platvormi-oigused",
      title: "Platvormi õigused sisu suhtes",
      paragraphs: [
        "Jätame endale õiguse eemaldada või piirata sisu, mis rikub tingimusi, on eksitav, ohtlik või mis kahjustab teisi kasutajaid või teenuse mainet.",
        "Võime peatada või sulgeda konto, kui esineb tõsine rikkumine, pettus või õiguslik nõue. Võimalusel anname ette hoiatuse, välja arvatud äärmuslikel juhtudel.",
      ],
    },
    {
      id: "piirang",
      title: "Vastutuse piirang",
      paragraphs: [
        "Teenus pakutakse „nagu on“. Püüame tagada stabiilse töö, kuid ei garanteeri katkematut kättesaadavust ega seda, et sobitamine või värbamine alati tulemusi toob.",
        "Maksimaalses seadusega lubatud ulatuses ei vastuta me kaudsete kahjude eest (sh saamata jäänud tulu). Töötaja ja tööandja vaheline leping sõlmitakse nende vahel; platvorm ei ole tööandja, kui pole eraldi kirjalikult kokku lepitud teisiti.",
      ],
    },
    {
      id: "peatamine",
      title: "Konto peatamine ja sulgemine",
      paragraphs: [
        "Võid igal ajal taotleda konto sulgemist vastavalt privaatsuspoliitikale ja andmekaitse lehel kirjeldatud korrale.",
        "Jätame endale õiguse peatada teenus hoolduse, uuenduste või force majeure tõttu. Oluliste muudatuste korral püüame ette teatada.",
      ],
    },
    {
      id: "muutmine",
      title: "Tingimuste muutmine",
      paragraphs: [
        "Võime tingimusi uuendada. Uuendatud versioon avaldatakse platvormil koos uue kehtivuskuupäevaga. Jätkates teenuse kasutamist pärast muudatuste jõustumist, loetakse, et oled uute tingimustega nõustunud. Kui muudatus on sinu jaoks oluline, võime küsida uut kinnitust.",
      ],
    },
    {
      id: "kontakt-tingimused",
      title: "Kontakt",
      paragraphs: [
        `Küsimuste korral: ${PL.emailGeneral}.`,
      ],
    },
  ],
  footnote:
    "Need tingimused on üldine raamistik. Enne tootmiskasutust peaks lõpliku versiooni kinnitama jurist ning täitma ettevõtte identiteedi väljad.",
};
