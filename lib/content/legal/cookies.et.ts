import type { LegalDocument } from "./types";

import { PL } from "./placeholders";

export const cookiesET: LegalDocument = {
  path: "/kupsised",
  metaTitle: "Küpsiste poliitika",
  metaDescription:
    "Mis on küpsised, milliseid Kvalifits kasutab ja kuidas neid hallata. Viide privaatsuspoliitikale.",
  h1: "Küpsiste poliitika",
  lead: `See poliitika selgitab, kuidas ${PL.operatorName} kasutab küpsiseid ja sarnaseid tehnoloogiaid platvormil Kvalifits. Täiendav teave isikuandmete töötlemise kohta on privaatsuspoliitikas (/privaatsus).`,
  lastUpdated: "2026-04-08",
  sections: [
    {
      id: "mis-on",
      title: "Mis on küpsised",
      paragraphs: [
        "Küpsis on väike tekstifail, mille sinu brauser salvestab seadmesse, kui külastad veebisaiti. Küpsised võimaldavad meil mäletada eelistusi, hoida sind sisselogituna (seansi küpsised) või mõista, kuidas saiti kasutatakse.",
      ],
    },
    {
      id: "liigid",
      title: "Milliseid küpsiseid kasutame",
      paragraphs: [
        "Kasutame järgmisi põhiliike (täpne nimekiri võib ajas muutuda vastavalt arendusele):",
      ],
      listItems: [
        "Hädavajalikud küpsised: autentimine, turvalisus, koormuse jaotus, seansi haldus. Need on vajalikud teenuse põhifunktsioonideks.",
        "Funktsionaalsed küpsised: eelistused (nt keel või kuvarežiim), kui oled need seadistanud.",
        "Analüütilised / statistilised küpsised: külastuste statistika, anonüümne või pseudonümiseeritud, kui seadus seda nõuab — tavaliselt ainult sinu nõusolekul.",
        "Turundusküpsised: kui kunagi kasutame sihtimist või konversioonide mõõtmist, teeme seda üksnes vastava nõusoleku alusel.",
      ],
    },
    {
      id: "milleks",
      title: "Milleks neid kasutatakse",
      paragraphs: [
        "Eesmärgid: platvormi turvaline töö, kasutajakogemuse parandamine, vigade tuvastamine ning — nõusolekul — analüütika, et mõista, kuidas funktsioone kasutatakse.",
      ],
    },
    {
      id: "hallamine",
      title: "Kuidas küpsiseid hallata",
      paragraphs: [
        "Võid brauseri seadistustes kustutada või blokeerida küpsiseid. Märkus: hädavajalike küpsiste keelamine võib takistada sisselogimist või mõnda funktsiooni.",
        "Kui kasutame nõusolekupõhist riba või seadete paneeli, saad seal valikuid muuta. Nõusoleku võid igal ajal tagasi võtta samas liideses või võttes meiega ühendust.",
      ],
    },
    {
      id: "kolmandad",
      title: "Kolmandad osapooled",
      paragraphs: [
        "Mõned küpsised võivad pärineda analüütika- või turvateenuse pakkujatest, kellega on sõlmitud lepingud. Nende nimed ja eesmärgid tuuakse võimalusel nõusolekuliideses eraldi välja.",
      ],
    },
    {
      id: "privaatsus-viide",
      title: "Seos privaatsuspoliitikaga",
      paragraphs: [
        "Isikuandmete töötlemine, mis võib küpsiste kaudu kaasneda, on kirjeldatud privaatsuspoliitikas (/privaatsus). Küsimuste korral: " +
          PL.emailPrivacy +
          ".",
      ],
    },
    {
      id: "uuendused",
      title: "Poliitika uuendamine",
      paragraphs: [
        "Võime seda dokumenti aeg-ajalt muuta. Kehtiva versiooni kuupäeva näed lehe alguses. Oluliste muudatuste puhul teavitame platvormi kaudu.",
      ],
    },
  ],
  footnote:
    "Konkreetne küpsiste nimekiri ja nõusolekuliides tuleks viia vastavusse tegeliku tehnilise lahendusega enne live’i.",
};
