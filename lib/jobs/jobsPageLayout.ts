import {
  SITE_CARD_PADDING,
  SITE_CONTAINER,
  SITE_CONTROL_HEIGHT,
  SITE_SECTION_GAP,
} from "@/lib/site/publicPageLayout";

/** Shared spacing tokens for the /tood jobs search page (layout only). */
export const JOBS_PAGE_CONTAINER = SITE_CONTAINER;

/** Major section separation: 40–48px mobile, 64–80px desktop. */
export const JOBS_PAGE_SECTION_GAP = `${SITE_SECTION_GAP} xl:mt-20`;

/** Sidebar + results grid: 16px mobile, 24px desktop column gap. */
export const JOBS_PAGE_MAIN_GRID =
  "grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-x-6 lg:gap-y-4";

/** Job cards list: 16px mobile, 24px desktop. */
export const JOBS_PAGE_LIST_GAP = "grid gap-4 lg:gap-6";

/** Unified control height for search, select, and buttons. */
export const JOBS_PAGE_CONTROL_HEIGHT = SITE_CONTROL_HEIGHT;

/** Job card padding: 16–20px mobile, 24px desktop. */
export const JOBS_PAGE_CARD_PADDING = SITE_CARD_PADDING;

/** Filter sidebar inner padding. */
export const JOBS_PAGE_SIDEBAR_PADDING = "p-4 lg:p-6";
