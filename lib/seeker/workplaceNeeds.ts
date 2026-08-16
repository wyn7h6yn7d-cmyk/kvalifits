/** Practical workplace arrangement needs — no medical/diagnosis fields. */

export const WORKPLACE_NEED_KEYS = [
  "accessible_workplace",
  "flexible_hours",
  "extra_breaks",
  "adapted_tools",
  "adapted_arrangement",
  "remote_option",
  "other_need",
] as const;

export type WorkplaceNeedKey = (typeof WORKPLACE_NEED_KEYS)[number];

export type WorkplaceNeedsRow = {
  accessible_workplace: boolean;
  flexible_hours: boolean;
  extra_breaks: boolean;
  adapted_tools: boolean;
  adapted_arrangement: boolean;
  remote_option: boolean;
  other_need: boolean;
  other_note: string | null;
  shared_with_employer: string[] | null;
  share_practical_needs_with_employer?: boolean | null;
};

export type WorkplaceNeedsFormValue = {
  accessible_workplace: boolean;
  flexible_hours: boolean;
  extra_breaks: boolean;
  adapted_tools: boolean;
  adapted_arrangement: boolean;
  remote_option: boolean;
  other_need: boolean;
  other_note: string;
  /** Master opt-in: allow sharing practical needs (never work-capacity status). */
  share_practical_needs_with_employer: boolean;
  /** Keys the seeker allows employers to see (on apply), when master opt-in is on. */
  shared_with_employer: WorkplaceNeedKey[];
};

/** Employer-safe snapshot item (no medical content). */
export type SharedWorkplaceNeed = {
  key: WorkplaceNeedKey;
  note?: string | null;
};

export function emptyWorkplaceNeedsFormValue(): WorkplaceNeedsFormValue {
  return {
    accessible_workplace: false,
    flexible_hours: false,
    extra_breaks: false,
    adapted_tools: false,
    adapted_arrangement: false,
    remote_option: false,
    other_need: false,
    other_note: "",
    share_practical_needs_with_employer: false,
    shared_with_employer: [],
  };
}

export function isWorkplaceNeedKey(v: unknown): v is WorkplaceNeedKey {
  return typeof v === "string" && (WORKPLACE_NEED_KEYS as readonly string[]).includes(v);
}

export function workplaceNeedsFromDb(row: WorkplaceNeedsRow | null | undefined): WorkplaceNeedsFormValue {
  if (!row) return emptyWorkplaceNeedsFormValue();
  const shared = (row.shared_with_employer ?? []).filter(isWorkplaceNeedKey);
  return {
    accessible_workplace: Boolean(row.accessible_workplace),
    flexible_hours: Boolean(row.flexible_hours),
    extra_breaks: Boolean(row.extra_breaks),
    adapted_tools: Boolean(row.adapted_tools),
    adapted_arrangement: Boolean(row.adapted_arrangement),
    remote_option: Boolean(row.remote_option),
    other_need: Boolean(row.other_need),
    other_note: (row.other_note ?? "").toString(),
    share_practical_needs_with_employer: Boolean(row.share_practical_needs_with_employer),
    shared_with_employer: shared,
  };
}

export function workplaceNeedsToDbPayload(value: WorkplaceNeedsFormValue) {
  const selectedShared = value.share_practical_needs_with_employer
    ? value.shared_with_employer.filter((key) => {
        if (!isWorkplaceNeedKey(key)) return false;
        if (key === "other_need") return value.other_need;
        return Boolean(value[key]);
      })
    : [];

  return {
    accessible_workplace: value.accessible_workplace,
    flexible_hours: value.flexible_hours,
    extra_breaks: value.extra_breaks,
    adapted_tools: value.adapted_tools,
    adapted_arrangement: value.adapted_arrangement,
    remote_option: value.remote_option,
    other_need: value.other_need,
    other_note: value.other_need ? value.other_note.trim().slice(0, 500) || null : null,
    share_practical_needs_with_employer: Boolean(value.share_practical_needs_with_employer),
    shared_with_employer: selectedShared,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Build employer-facing list from private row.
 * Requires master opt-in + per-key share. Never includes work-capacity status.
 */
export function buildSharedWorkplaceNeeds(
  row: WorkplaceNeedsRow | null | undefined
): SharedWorkplaceNeed[] {
  if (!row || !row.share_practical_needs_with_employer) return [];
  const shared = new Set((row.shared_with_employer ?? []).filter(isWorkplaceNeedKey));
  const out: SharedWorkplaceNeed[] = [];

  for (const key of WORKPLACE_NEED_KEYS) {
    if (!shared.has(key)) continue;
    const enabled =
      key === "other_need" ? Boolean(row.other_need) : Boolean(row[key as keyof WorkplaceNeedsRow]);
    if (!enabled) continue;
    if (key === "other_need") {
      out.push({ key, note: (row.other_note ?? "").toString().trim() || null });
    } else {
      out.push({ key });
    }
  }
  return out;
}
