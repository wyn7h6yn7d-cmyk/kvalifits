import { isCalendarDatePast, toCalendarDate, calendarDateInTallinn, addCalendarDays } from "@/lib/jobs/jobLifecycle";

const DEFAULT_WINDOW_DAYS = 3;

export function isSavedJobNearDeadline(args: {
  status?: string | null;
  application_deadline?: string | null;
  asOf?: Date;
  windowDays?: number;
}): boolean {
  if ((args.status ?? "").toString() !== "published") return false;
  const deadline = toCalendarDate(args.application_deadline);
  if (!deadline) return false;
  const asOf = args.asOf ?? new Date();
  if (isCalendarDatePast(deadline, asOf)) return false;
  const windowDays = args.windowDays ?? DEFAULT_WINDOW_DAYS;
  const today = calendarDateInTallinn(asOf);
  const latest = addCalendarDays(today, windowDays);
  return deadline <= latest;
}

export function savedJobDeadlineDaysLeft(args: {
  application_deadline?: string | null;
  asOf?: Date;
}): number | null {
  const deadline = toCalendarDate(args.application_deadline);
  if (!deadline) return null;
  const today = calendarDateInTallinn(args.asOf ?? new Date());
  const start = Date.parse(`${today}T00:00:00Z`);
  const end = Date.parse(`${deadline}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.round((end - start) / (24 * 60 * 60 * 1000));
}
