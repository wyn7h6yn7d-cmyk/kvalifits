"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  closeLabel: string;
  trigger: ReactNode;
  children: ReactNode;
};

/** Accessible Quick Apply chrome. Form body is passed through unchanged. */
export function QuickApplySheet({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  trigger,
  children,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger}
      <SheetContent
        side="full"
        showCloseButton={false}
        overlayClassName="z-[80]"
        className="z-[80] bg-[#121216]"
        data-testid="quick-apply-dialog"
        aria-modal="true"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-start justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 lg:pt-3">
            <div className="min-w-0">
              <SheetTitle className="text-base font-semibold text-white/90">{title}</SheetTitle>
              <SheetDescription className="mt-0.5 text-[13px] leading-snug text-white/50">
                {description}
              </SheetDescription>
            </div>
            <SheetClose asChild>
              <button
                type="button"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.10] text-white/70 hover:bg-white/[0.06] focus-visible:outline-none"
                aria-label={closeLabel}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </SheetClose>
          </div>
          <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col")}>{children}</div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function scrollApplyFieldIntoView(event: { currentTarget: HTMLElement }) {
  event.currentTarget.scrollIntoView({ block: "center", inline: "nearest" });
}
