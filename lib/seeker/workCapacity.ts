/** Private voluntary work-capacity status — never for employers / matching / filters. */

export const WORK_CAPACITY_STATUS_VALUES = [
  "prefer_not_to_say",
  "partial",
  "absent",
] as const;

export type WorkCapacityStatus = (typeof WORK_CAPACITY_STATUS_VALUES)[number];

export type WorkCapacityRow = {
  status: string | null;
};

export function isWorkCapacityStatus(v: unknown): v is WorkCapacityStatus {
  return typeof v === "string" && (WORK_CAPACITY_STATUS_VALUES as readonly string[]).includes(v);
}

export function workCapacityFromDb(row: WorkCapacityRow | null | undefined): WorkCapacityStatus {
  const s = row?.status;
  return isWorkCapacityStatus(s) ? s : "prefer_not_to_say";
}

export function workCapacityToDbPayload(status: WorkCapacityStatus) {
  return {
    status: isWorkCapacityStatus(status) ? status : "prefer_not_to_say",
    updated_at: new Date().toISOString(),
  };
}
