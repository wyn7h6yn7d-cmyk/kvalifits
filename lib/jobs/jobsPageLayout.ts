import {
  SITE_CARD_PADDING,
  SITE_CONTAINER,
} from "@/lib/site/publicPageLayout";

/** Shared spacing tokens for the /tood jobs search page (layout only). */
export const JOBS_PAGE_CONTAINER = SITE_CONTAINER;

/** Extra space below fixed navbar before page title (main already applies header offset). */
export const JOBS_PAGE_TOP = "pt-6 sm:pt-8 lg:pt-10";

/** Major section separation after search header. */
export const JOBS_PAGE_SECTION_GAP = "mt-5 sm:mt-6 lg:mt-7";

/** Sidebar + results grid. */
export const JOBS_PAGE_MAIN_GRID =
  "grid gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:items-start lg:gap-x-8 lg:gap-y-3";

/** Job cards list. */
export const JOBS_PAGE_LIST_GAP = "grid gap-4 lg:gap-5";

/** Unified control height for search, select, and buttons. */
export const JOBS_PAGE_CONTROL_HEIGHT = "h-11 sm:h-12";

/** Job card padding. */
export const JOBS_PAGE_CARD_PADDING = SITE_CARD_PADDING;

/** Filter sidebar inner padding. */
export const JOBS_PAGE_SIDEBAR_PADDING = "p-4 lg:p-5";

/** Dark filter panel surface (sidebar + mobile sheet). */
export const JOBS_PAGE_SIDEBAR_SURFACE =
  "rounded-xl border border-white/[0.11] bg-[#14141f] shadow-[0_16px_48px_-32px_rgba(0,0,0,0.55)]";

/** Full-width search bar shell. */
export const JOBS_PAGE_SEARCH_BAR =
  "overflow-hidden rounded-xl border border-white/[0.11] bg-[#12121a]";

/** Focus/hover wash inside search fields. */
export const JOBS_PAGE_SEARCH_FIELD_FOCUS = "transition-colors focus-within:bg-white/[0.03]";

/** Compact dark empty state for job results. */
export const JOBS_PAGE_EMPTY_STATE =
  "w-full max-w-lg rounded-xl border border-white/[0.08] bg-[#12121a]/90 px-5 py-6 text-center sm:px-6 sm:py-7";
