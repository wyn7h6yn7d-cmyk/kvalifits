/**
 * Human Premium marketing photography catalog.
 *
 * HUMAN IMAGE RULES (canonical): docs/design-guidelines.md
 * Slot briefs: public/marketing/PHOTO_BRIEF.md
 *
 * Never use AI-generated people. Prefer documentary workplace photography.
 * If no good photo exists: leave `status: "needed"` — do not use bad stock.
 */

export type MarketingProfession =
  | "electrician_technician"
  | "builder_carpenter"
  | "production_worker"
  | "warehouse_logistics"
  | "service_worker"
  | "hair_beauty"
  | "healthcare_worker"
  | "office_worker"
  | "it_specialist";

export type MarketingSlotId =
  | "heroPerson"
  | "realLife"
  | "landingSeeker"
  | "landingEmployer"
  | "audienceSeeker"
  | "audienceEmployer"
  | "benefitsWorkspace"
  | "finalCtaPeople";

export type MarketingPhotoSlot = {
  /** Public URL path under `/public`. */
  path: string;
  /** Primary occupation this slot should represent. */
  profession: MarketingProfession;
  /** Optional secondary occupations this slot may rotate through later. */
  alsoFits?: MarketingProfession[];
  /** `filled` only when a licensed file exists at `path`. */
  status: "filled" | "needed";
  /** Short casting brief for photo sourcing. */
  brief: string;
  /** Avoid notes for this specific slot. */
  avoid: string;
  /** Credit when filled (photographer / licence source). */
  credit?: string;
  /** Source URL when filled. */
  sourceUrl?: string;
};

export const MARKETING_PROFESSION_LABELS: Record<
  MarketingProfession,
  { et: string; en: string; ru: string }
> = {
  electrician_technician: {
    et: "Elektrik / tehnik",
    en: "Electrician / technician",
    ru: "Электрик / техник",
  },
  builder_carpenter: {
    et: "Ehitaja / puusepp",
    en: "Builder / carpenter",
    ru: "Строитель / плотник",
  },
  production_worker: {
    et: "Tootmistöötaja",
    en: "Production worker",
    ru: "Работник производства",
  },
  warehouse_logistics: {
    et: "Laotöötaja / logistika",
    en: "Warehouse / logistics",
    ru: "Склад / логистика",
  },
  service_worker: {
    et: "Teenindaja",
    en: "Service worker",
    ru: "Работник сферы услуг",
  },
  hair_beauty: {
    et: "Juuksur / iluteenindaja",
    en: "Hair / beauty professional",
    ru: "Парикмахер / бьюти-мастер",
  },
  healthcare_worker: {
    et: "Tervishoiutöötaja",
    en: "Healthcare worker",
    ru: "Медработник",
  },
  office_worker: {
    et: "Kontoritöötaja",
    en: "Office worker",
    ru: "Офисный сотрудник",
  },
  it_specialist: {
    et: "IT-spetsialist",
    en: "IT specialist",
    ru: "IT-специалист",
  },
};

/**
 * Required coverage — every profession should appear somewhere over time.
 * Hero currently covers builder/carpenter; remaining slots should fill the rest.
 */
export const MARKETING_PROFESSION_COVERAGE: MarketingProfession[] = [
  "electrician_technician",
  "builder_carpenter",
  "production_worker",
  "warehouse_logistics",
  "service_worker",
  "hair_beauty",
  "healthcare_worker",
  "office_worker",
  "it_specialist",
];

export const MARKETING_PHOTO_SLOTS: Record<MarketingSlotId, MarketingPhotoSlot> = {
  heroPerson: {
    path: "/marketing/hero-person.jpg",
    profession: "builder_carpenter",
    alsoFits: ["production_worker"],
    status: "filled",
    brief:
      "Person mid-work in a real workshop or site, natural smile or quiet focus, documentary light. Ages 30–55 welcome.",
    avoid: "White studio, handshake, laptop hero, thumbs-up, polished fashion lighting.",
    credit: "Ali Mkumbwa / Unsplash",
    sourceUrl: "https://unsplash.com/photos/a-man-smiles-as-he-works-on-a-piece-of-wood-PxlKOcj0a3Q",
  },
  realLife: {
    path: "/marketing/real-life.jpg",
    profession: "electrician_technician",
    alsoFits: ["production_worker"],
    status: "filled",
    brief:
      "Documentary workplace moment: tradesperson mid-task with real tools and focus. Natural light, mixed ages.",
    avoid: "Staged team huddle, stock handshake, overly styled clinic/office set.",
    credit: "Unsplash",
    sourceUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e",
  },
  landingSeeker: {
    path: "/marketing/landing-seeker.jpg",
    profession: "electrician_technician",
    alsoFits: ["warehouse_logistics", "production_worker"],
    status: "needed",
    brief:
      "Job seeker energy without cliché: trades or logistics person in real gear at work, looking capable and at ease.",
    avoid: "Resume-holding pose, suit on white background, fake celebration.",
  },
  landingEmployer: {
    path: "/marketing/landing-employer.jpg",
    profession: "office_worker",
    alsoFits: ["it_specialist", "production_worker"],
    status: "needed",
    brief:
      "Hiring context that still feels human: supervisor or lead talking with a colleague on the floor or in a modest office — not a boardroom.",
    avoid: "Corporate handshake, glass-tower skyline, pointing at whiteboard stock.",
  },
  audienceSeeker: {
    path: "/marketing/audience-seeker.jpg",
    profession: "service_worker",
    alsoFits: ["hair_beauty"],
    status: "filled",
    brief:
      "Service or craft professional mid-task (salon, café, desk with real tools). Natural posture, not model casting.",
    avoid: "Beauty-campaign retouching, empty white loft, posed grin at camera.",
    credit: "Unsplash",
    sourceUrl: "https://images.unsplash.com/photo-1595475038784-bbe439ff41e6",
  },
  audienceEmployer: {
    path: "/marketing/audience-employer.jpg",
    profession: "office_worker",
    alsoFits: ["warehouse_logistics"],
    status: "filled",
    brief:
      "Team lead or small-business employer in a real workplace — calm authority, not a boardroom pose.",
    avoid: "Executive portrait with crossed arms, handshake close-up.",
    credit: "Unsplash",
    sourceUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a",
  },
  benefitsWorkspace: {
    path: "/marketing/benefits-workspace.jpg",
    profession: "production_worker",
    alsoFits: ["electrician_technician", "it_specialist"],
    status: "needed",
    brief:
      "Wide-ish workplace frame: hands and tools visible, environment tells the job story more than the face.",
    avoid: "Empty modern lobby, generic coworking, laptop+coffee still life.",
  },
  finalCtaPeople: {
    path: "/marketing/final-cta-people.jpg",
    profession: "service_worker",
    alsoFits: ["healthcare_worker", "office_worker"],
    status: "needed",
    brief:
      "Quiet confidence after work done well — one or two people, real setting, soft emotion.",
    avoid: "Confetti, group high-five, call-center headset smile.",
  },
};

/** Path map for legacy imports. Prefer `getMarketingPhotoSrc(slotId)`. */
export const MARKETING_PHOTOS = {
  heroPerson: MARKETING_PHOTO_SLOTS.heroPerson.path,
  realLife: MARKETING_PHOTO_SLOTS.realLife.path,
  audienceSeeker: MARKETING_PHOTO_SLOTS.audienceSeeker.path,
  audienceEmployer: MARKETING_PHOTO_SLOTS.audienceEmployer.path,
  benefitsWorkspace: MARKETING_PHOTO_SLOTS.benefitsWorkspace.path,
  finalCtaPeople: MARKETING_PHOTO_SLOTS.finalCtaPeople.path,
  landingSeeker: MARKETING_PHOTO_SLOTS.landingSeeker.path,
  landingEmployer: MARKETING_PHOTO_SLOTS.landingEmployer.path,
} as const;

/** Returns a public path only when the licensed file is marked filled. */
export function getMarketingPhotoSrc(slotId: MarketingSlotId): string | null {
  const slot = MARKETING_PHOTO_SLOTS[slotId];
  return slot.status === "filled" ? slot.path : null;
}

export function getMarketingPhotoSlot(slotId: MarketingSlotId): MarketingPhotoSlot {
  return MARKETING_PHOTO_SLOTS[slotId];
}

/** Professions that still need at least one filled slot. */
export function getMissingMarketingProfessions(): MarketingProfession[] {
  const covered = new Set(
    Object.values(MARKETING_PHOTO_SLOTS)
      .filter((slot) => slot.status === "filled")
      .flatMap((slot) => [slot.profession, ...(slot.alsoFits ?? [])]),
  );
  return MARKETING_PROFESSION_COVERAGE.filter((profession) => !covered.has(profession));
}
