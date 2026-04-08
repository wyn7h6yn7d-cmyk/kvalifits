import type { LegalDocument } from "./types";

import { PL } from "./placeholders";

export const cookiesEN: LegalDocument = {
  path: "/kupsised",
  metaTitle: "Cookie policy",
  metaDescription:
    "What cookies are, which ones Kvalifits uses, how to manage them, and link to the privacy policy.",
  h1: "Cookie policy",
  lead: `This policy explains how ${PL.operatorName} uses cookies and similar technologies on Kvalifits. More on personal data processing is in the privacy policy (/en/privaatsus).`,
  lastUpdated: "2026-04-08",
  sections: [
    {
      id: "mis-on",
      title: "What cookies are",
      paragraphs: [
        "Cookies are small text files stored on your device when you visit a site. They help remember preferences, keep you signed in (session cookies), or understand how the site is used.",
      ],
    },
    {
      id: "liigid",
      title: "Cookies we use",
      paragraphs: ["We use the following broad categories (exact names may evolve with the product):"],
      listItems: [
        "Strictly necessary: authentication, security, load balancing, session management.",
        "Functional: preferences such as language where you configure them.",
        "Analytics: aggregated or pseudonymous usage statistics, typically only with consent where required.",
        "Marketing: only with consent if we use targeting or conversion tracking.",
      ],
    },
    {
      id: "milleks",
      title: "Purposes",
      paragraphs: [
        "We use cookies to run the platform securely, improve UX, fix errors and — with consent — understand feature usage.",
      ],
    },
    {
      id: "hallamine",
      title: "Managing cookies",
      paragraphs: [
        "You can delete or block cookies in your browser. Note: blocking necessary cookies may break sign-in or some features.",
        "If we provide a consent banner or settings panel, you can change choices there and withdraw consent at any time.",
      ],
    },
    {
      id: "kolmandad",
      title: "Third parties",
      paragraphs: [
        "Some cookies may be set by analytics or security vendors under contract. Names and purposes should be listed in the consent UI where applicable.",
      ],
    },
    {
      id: "privaatsus-viide",
      title: "Privacy policy",
      paragraphs: [
        "Processing of personal data related to cookies is described in the privacy policy (/en/privaatsus). Questions: " +
          PL.emailPrivacy +
          ".",
      ],
    },
    {
      id: "uuendused",
      title: "Updates",
      paragraphs: ["We may update this policy. The date at the top shows the current version."],
    },
  ],
  footnote: "Align the cookie list and consent UI with your actual implementation before launch.",
};
