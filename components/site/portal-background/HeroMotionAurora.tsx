import { cn } from "@/lib/utils";

/**
 * Slow rotating blue/violet light wash — atmosphere, not a spotlight on the person.
 * `bias="empty"` keeps blobs in emptier hero zones (left / top).
 */
export function HeroMotionAurora({
  className,
  bias = "center",
}: {
  className?: string;
  bias?: "center" | "empty";
}) {
  const empty = bias === "empty";

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div
        className={cn(
          "homepage-hero-aurora absolute h-[min(140%,720px)] w-[min(150%,920px)] -translate-x-1/2 -translate-y-1/2",
          empty
            ? "left-[22%] top-[24%] sm:left-[20%] lg:left-[26%] lg:top-[30%]"
            : "left-[46%] top-[28%]",
        )}
      />
      <div
        className={cn(
          "homepage-hero-aurora homepage-hero-aurora--reverse absolute h-[min(120%,640px)] w-[min(130%,820px)] -translate-x-1/2 -translate-y-1/2 opacity-70",
          empty
            ? "left-[12%] top-[48%] opacity-55 sm:left-[14%] lg:left-[18%] lg:top-[44%]"
            : "left-[58%] top-[42%]",
        )}
      />
    </div>
  );
}
