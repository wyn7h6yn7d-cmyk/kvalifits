/** Site-wide public page layout tokens (spacing, typography, surfaces). */

export const SITE_CONTAINER = "mx-auto w-full max-w-[1320px] px-4 md:px-6 lg:px-8 xl:px-10";

export const SITE_CONTAINER_PROSE = "max-w-3xl";

/** Breathing room below fixed header (main already applies header offset). */
export const SITE_PAGE_TOP = "pt-6 sm:pt-8 lg:pt-10";

export const SITE_SECTION_PY = "py-10 sm:py-16 lg:py-20";

export const SITE_SECTION_PB = "pb-12 sm:pb-16 lg:pb-20";

export const SITE_SECTION_GAP = "mt-10 md:mt-12 lg:mt-16";

/** Homepage vertical rhythm — editorial whitespace on a single dark canvas. */
export const SITE_HOME_SECTION = "relative bg-background py-20 sm:py-24 lg:py-32";

/** @deprecated Same as SITE_HOME_SECTION — kept for API compatibility. */
export const SITE_HOME_SECTION_RAISED = SITE_HOME_SECTION;

/** @deprecated Same as SITE_HOME_SECTION — kept for API compatibility. */
export const SITE_HOME_SECTION_DEEP = SITE_HOME_SECTION;

export const SITE_HOME_SECTION_HEADER = "mb-12 sm:mb-14 lg:mb-16";

/** Centered CTA copy column (final CTA). */
export const SITE_HOME_INNER_CTA = "mx-auto w-full max-w-3xl lg:max-w-[42rem]";

/** FAQ accordion — wide but not full-bleed on ultra-wide screens. */
export const SITE_HOME_INNER_FAQ = "mx-auto w-full max-w-3xl lg:max-w-4xl";

/** @deprecated Use SITE_HOME_INNER_CTA or SITE_HOME_INNER_FAQ */
export const SITE_HOME_INNER = SITE_HOME_INNER_CTA;

export const SITE_HOME_HERO_INNER = "mx-auto w-full max-w-3xl lg:max-w-[46rem] xl:max-w-[52rem]";

export const SITE_H1_HERO =
  "type-hero-title text-balance text-[2.25rem] font-bold leading-[1.06] tracking-[-0.042em] text-white sm:text-[2.875rem] lg:text-[clamp(3rem,4.2vw+1rem,4.75rem)] lg:leading-[1.02]";

export const SITE_H2_HOME =
  "text-balance text-[1.625rem] font-bold leading-[1.12] tracking-[-0.03em] text-foreground sm:text-[1.875rem] lg:text-[2.375rem]";

/** Quiet editorial surface — less glass/glow than classic SaaS cards. */
export const SITE_HOME_CARD =
  "rounded-2xl border border-white/[0.08] bg-[#12121a]/90 shadow-[0_20px_48px_-40px_rgba(0,0,0,0.85)] transition-[border-color,background-color] duration-200 ease-out hover:border-white/[0.12] hover:bg-[#14141c]";

export const SITE_HOME_CTA_PRIMARY = "h-12 min-h-12 px-7 lg:h-14 lg:min-h-14 lg:px-8 lg:text-[1.0625rem]";

export const SITE_HOME_CTA_SECONDARY =
  "h-12 min-h-12 px-7 font-medium lg:h-14 lg:min-h-14 lg:px-8 lg:text-[1.0625rem]";

export const SITE_H1_UTILITY =
  "text-[1.5rem] font-bold leading-[1.14] tracking-[-0.028em] text-foreground sm:text-[1.625rem] lg:text-[1.75rem]";

export const SITE_H1_DETAIL =
  "text-balance text-[1.625rem] font-bold leading-[1.12] tracking-[-0.03em] text-foreground sm:text-[1.875rem] lg:text-[2.125rem]";

export const SITE_H2 =
  "text-[1.1875rem] font-semibold leading-[1.25] tracking-[-0.02em] text-foreground sm:text-[1.3125rem]";

export const SITE_H2_SECTION =
  "text-balance text-[1.5rem] font-bold leading-[1.12] tracking-[-0.028em] text-foreground sm:text-[1.625rem] lg:text-[1.875rem]";

export const SITE_H3 =
  "text-[1.125rem] font-semibold leading-[1.3] tracking-[-0.015em] text-foreground sm:text-[1.1875rem] lg:text-[1.25rem]";

export const SITE_BODY = "text-[1.0625rem] leading-[1.72] text-body lg:text-[1.125rem] lg:leading-[1.7]";

export const SITE_BODY_SM = "text-[1rem] leading-[1.68] text-body";

/** Lead / intro copy — slightly larger, softer than body. */
export const SITE_BODY_LEAD =
  "text-[1.0625rem] leading-[1.72] text-muted sm:text-[1.125rem] sm:leading-[1.68] lg:text-[1.1875rem]";

/** Visible field labels — sentence case, not tiny caps. */
export const SITE_LABEL =
  "text-[0.9375rem] font-medium leading-snug tracking-[-0.01em] text-foreground lg:text-[1rem]";

export const SITE_EYEBROW =
  "text-[0.9375rem] font-medium leading-snug tracking-[0.02em] text-muted-2";

export const SITE_CARD_SURFACE =
  "rounded-xl border border-border bg-surface-elevated shadow-[0_16px_48px_-32px_rgba(0,0,0,0.55)]";

export const SITE_CARD_PADDING = "p-4 sm:p-5";

export const SITE_AUTH_CARD =
  "rounded-xl border border-border bg-[#14141a] p-5 sm:p-8";

/** Dark inset panel (notices, form sections, closed-state messages). */
export const SITE_DARK_INSET =
  "rounded-xl border border-white/[0.08] bg-[#12121a]";

/** Dark info / notice box (auth banners, inline alerts). */
export const SITE_DARK_NOTICE =
  "rounded-2xl border border-white/[0.08] bg-[#12121a] px-4 py-3 text-sm text-muted";

/** Dark modal / bottom-sheet surface. */
export const SITE_DARK_MODAL =
  "border border-white/[0.11] bg-[#14141f] shadow-[0_24px_64px_-32px_rgba(0,0,0,0.85)]";

/** Dark card surface (job cards, similar jobs, company jobs). */
export const SITE_DARK_CARD =
  "rounded-xl border border-white/[0.09] bg-[linear-gradient(165deg,rgba(22,22,32,0.96)_0%,rgba(14,14,21,0.94)_100%)] shadow-[0_16px_48px_-32px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.06)]";

export const SITE_DARK_CARD_HOVER =
  "transition-[border-color,background-color] hover:border-white/[0.14] hover:bg-white/[0.02]";

/** Dark chip / tag fallback. */
export const SITE_DARK_CHIP =
  "rounded-lg border border-white/[0.08] bg-[#12121a]";

/** Dark empty-state shell. */
export const SITE_DARK_EMPTY_STATE =
  "rounded-xl border border-white/[0.08] bg-[#12121a]/90 px-5 py-10 text-center sm:px-8";

export const SITE_DARK_EMPTY_ICON =
  "mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.04] text-muted-2";

/** Sticky mobile footer bar (apply CTA, sheet actions). */
export const SITE_DARK_FOOTER_BAR =
  "shrink-0 border-t border-white/[0.08] bg-[#0e0e14]/95 backdrop-blur-sm";

/** Admin / account list panel and empty states. */
export const SITE_DARK_PANEL =
  "rounded-3xl border border-white/[0.08] bg-[#12121a]";

/** Admin list item card. */
export const SITE_DARK_LIST_ITEM =
  "rounded-3xl border border-white/[0.09] bg-[#12121a]/95";

/** Admin table header strip. */
export const SITE_DARK_TABLE_HEADER =
  "border-b border-white/[0.08] bg-white/[0.04]";

/** Admin table row. */
export const SITE_DARK_TABLE_ROW =
  "border-b border-white/[0.06] bg-transparent hover:bg-white/[0.02] last:border-b-0";

/** Admin form input (native select/textarea in tables). */
export const SITE_DARK_FIELD =
  "rounded-2xl border border-white/[0.10] bg-[#12121a] text-foreground/80 outline-none focus:border-[rgba(37,99,235,0.35)]";

export const SITE_GRID_GAP = "gap-5 lg:gap-7";

export const SITE_GRID_GAP_LOOSE = "gap-8 lg:gap-12";

export const SITE_CONTROL_HEIGHT = "h-11";

export const SITE_INPUT_RADIUS = "rounded-2xl";

/** Hero search bar row height (mobile → desktop). */
export const SITE_HERO_SEARCH_HEIGHT = "min-h-[4rem] sm:min-h-[4.25rem] lg:min-h-[4.5rem]";
