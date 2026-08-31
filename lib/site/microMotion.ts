/** Shared micro-animation class tokens — premium, fast, ease-out. */

export const KF_MOTION_DURATION = "duration-[220ms]";

export const KF_ACCORDION_GRID =
  "grid grid-rows-[0fr] transition-[grid-template-rows] duration-[220ms] ease-out group-open:grid-rows-[1fr] motion-reduce:transition-none";

export const KF_ACCORDION_INNER = "min-h-0 overflow-hidden";

export const KF_ACCORDION_BODY =
  "opacity-0 transition-opacity duration-[220ms] ease-out group-open:opacity-100 motion-reduce:transition-none";

export const KF_EXPAND_GRID = (open: boolean) =>
  `grid transition-[grid-template-rows] duration-[220ms] ease-out motion-reduce:duration-75 motion-reduce:transition-[grid-template-rows] ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`;

export const KF_EXPAND_BODY = (open: boolean) =>
  `transition-opacity duration-[220ms] ease-out motion-reduce:duration-75 ${open ? "opacity-100" : "opacity-0"}`;

export const KF_CHEVRON = "transition-transform duration-[220ms] ease-out motion-reduce:transition-none";

export const KF_DROPDOWN_PANEL =
  "transition-[opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none";

export const KF_HOVER_LIFT =
  "transition-[transform,box-shadow,border-color,background-color,color] duration-200 ease-out hover:-translate-y-px active:translate-y-0 motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0";

export const KF_RADIX_OVERLAY = "kf-radix-overlay";

export const KF_DIALOG_SHEET = "kf-dialog-sheet";

export const KF_DIALOG_FULLSCREEN = "kf-dialog-fullscreen";
