"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
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
        className="z-[80] bg-[#0e0e14]"
        data-testid="quick-apply-dialog"
        aria-modal="true"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-start justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 lg:pt-3">
            <div className="min-w-0">
              <SheetTitle className="text-[1.125rem] font-semibold leading-snug text-foreground">{title}</SheetTitle>
              <SheetDescription className="mt-1 text-[0.9375rem] leading-[1.6] text-muted">
                {description}
              </SheetDescription>
            </div>
            <SheetClose asChild>
              <Button type="button" variant="outline" size="icon" aria-label={closeLabel}>
                <X aria-hidden />
              </Button>
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
