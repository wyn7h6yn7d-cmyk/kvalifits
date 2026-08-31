/** Site-wide public page layout tokens (spacing, typography, surfaces). */

export const SITE_CONTAINER = "mx-auto w-full max-w-[1120px] px-4 md:px-6 lg:px-8";

export const SITE_CONTAINER_PROSE = "max-w-3xl";

/** Breathing room below fixed header (main already applies header offset). */
export const SITE_PAGE_TOP = "pt-6 sm:pt-8 lg:pt-10";

export const SITE_SECTION_PY = "py-10 sm:py-16 lg:py-20";

export const SITE_SECTION_PB = "pb-12 sm:pb-16 lg:pb-20";

export const SITE_SECTION_GAP = "mt-10 md:mt-12 lg:mt-16";

/** Homepage vertical rhythm — generous but not bloated. */
export const SITE_HOME_SECTION = "relative bg-background py-14 sm:py-16 lg:py-20";

export const SITE_HOME_SECTION_RAISED =
  "relative border-y border-white/[0.07] bg-[linear-gradient(180deg,#13131d_0%,#0c0c13_100%)] py-14 sm:py-16 lg:py-20";

export const SITE_HOME_SECTION_DEEP =
  "relative border-t border-white/[0.08] bg-[linear-gradient(180deg,#0a0a10_0%,#07070c_100%)] py-16 sm:py-20 lg:py-24";

export const SITE_HOME_SECTION_HEADER = "mb-10 sm:mb-11 lg:mb-14";

/** Shared narrow column for hero copy, FAQ, final CTA. */
export const SITE_HOME_INNER = "mx-auto w-full max-w-3xl";

export const SITE_HOME_HERO_INNER = "mx-auto w-full max-w-3xl lg:max-w-[40rem]";

export const SITE_H1_HERO =
  "type-hero-title text-balance text-[2.125rem] font-bold leading-[1.06] tracking-[-0.042em] text-white sm:text-[2.625rem] lg:text-[clamp(2.875rem,3.8vw+1rem,4.125rem)] lg:leading-[1.02]";

export const SITE_H2_HOME =
  "text-balance text-[1.5rem] font-bold leading-[1.12] tracking-[-0.03em] text-foreground sm:text-[1.75rem] lg:text-[2.125rem]";

export const SITE_HOME_CARD =
  "rounded-2xl border border-white/[0.11] bg-[linear-gradient(165deg,rgba(22,22,32,0.96)_0%,rgba(14,14,21,0.94)_100%)] shadow-[0_24px_64px_-36px_rgba(0,0,0,0.92),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[6px] transition-[border-color,box-shadow] duration-300 hover:border-violet-400/20 hover:shadow-[0_28px_72px_-32px_rgba(79,70,229,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]";

export const SITE_HOME_CTA_PRIMARY = "h-12 min-h-12 px-7";

export const SITE_HOME_CTA_SECONDARY = "h-12 min-h-12 px-7 font-medium";

export const SITE_H1_UTILITY =
  "text-[1.5rem] font-bold leading-[1.14] tracking-[-0.028em] text-foreground sm:text-[1.625rem] lg:text-[1.75rem]";

export const SITE_H1_DETAIL =
  "text-balance text-[1.625rem] font-bold leading-[1.12] tracking-[-0.03em] text-foreground sm:text-[1.875rem] lg:text-[2.125rem]";

export const SITE_H2 =
  "text-[1.1875rem] font-semibold leading-[1.25] tracking-[-0.02em] text-foreground sm:text-[1.3125rem]";

export const SITE_H2_SECTION =
  "text-balance text-[1.5rem] font-bold leading-[1.12] tracking-[-0.028em] text-foreground sm:text-[1.625rem] lg:text-[1.875rem]";

export const SITE_H3 =
  "text-[1.0625rem] font-semibold leading-[1.3] tracking-[-0.015em] text-foreground sm:text-[1.125rem]";

export const SITE_BODY = "text-[1.0625rem] leading-[1.72] text-body";

export const SITE_BODY_SM = "text-[0.9375rem] leading-[1.65] text-body";

/** Lead / intro copy — slightly larger, softer than body. */
export const SITE_BODY_LEAD =
  "text-[1.0625rem] leading-[1.72] text-muted sm:text-[1.125rem] sm:leading-[1.68]";

/** Visible field labels — sentence case, not tiny caps. */
export const SITE_LABEL =
  "text-[0.9375rem] font-medium leading-snug tracking-[-0.01em] text-foreground";

export const SITE_EYEBROW =
  "text-[0.875rem] font-medium leading-snug tracking-[0.02em] text-muted-2";

export const SITE_CARD_SURFACE =
  "rounded-xl border border-border bg-surface-elevated shadow-[0_16px_48px_-32px_rgba(0,0,0,0.55)]";

export const SITE_CARD_PADDING = "p-4 sm:p-5";

export const SITE_AUTH_CARD =
  "rounded-xl border border-border bg-[#14141a] p-5 sm:p-8";

export const SITE_GRID_GAP = "gap-4 lg:gap-6";

export const SITE_GRID_GAP_LOOSE = "gap-8 lg:gap-12";

export const SITE_CONTROL_HEIGHT = "h-11";

export const SITE_INPUT_RADIUS = "rounded-2xl";
