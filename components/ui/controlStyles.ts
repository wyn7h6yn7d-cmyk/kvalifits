import { cn } from "@/lib/utils";

/** Shared control tokens for buttons, selects, and button-like chrome. */
export const controlTokens = {
  height: "h-11",
  heightLg: "h-12",
  px: "px-5",
  pxCompact: "px-4",
  radius: "rounded-xl",
  text: "font-sans text-[0.9375rem] font-medium leading-snug",
  gap: "gap-2",
  icon: "h-4 w-4 shrink-0",
  border: "border border-border-strong",
  borderHover: "hover:border-white/[0.14]",
  surface: "bg-[#12121a]",
  surfaceMuted: "bg-[#14141f]",
  focus:
    "outline-none focus-visible:border-violet-400/40 focus-visible:ring-2 focus-visible:ring-violet-400/20",
} as const;

export function selectControlClassName(className?: string) {
  return cn(
    "inline-flex w-full min-w-0 appearance-none items-center",
    controlTokens.height,
    controlTokens.pxCompact,
    "pr-10",
    controlTokens.radius,
    controlTokens.border,
    controlTokens.borderHover,
    controlTokens.surfaceMuted,
    controlTokens.text,
    "text-foreground/80 transition-[border-color,background-color]",
    "[color-scheme:dark]",
    controlTokens.focus,
    "disabled:cursor-not-allowed disabled:opacity-50",
    "bg-[length:1rem_1rem] bg-[position:right_0.85rem_center] bg-no-repeat",
    "bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27rgba(255,255,255,0.45)%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpolyline points=%276 9 12 15 18 9%27/%3E%3C/svg%3E')]",
    className,
  );
}

/** Native `<select>` styled like standalone form inputs (rounded-2xl). */
export function nativeSelectFormClassName(className?: string) {
  return cn(
    controlTokens.height,
    "w-full rounded-2xl border border-border bg-[#12121a] px-4 text-base leading-snug text-foreground outline-none transition-[border-color,background-color] focus:border-violet-400/40",
    className,
  );
}
