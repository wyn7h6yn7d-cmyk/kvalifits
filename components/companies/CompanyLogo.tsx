import { cn } from "@/lib/utils";

export function CompanyLogo({
  url,
  name,
  size = "md",
}: {
  url?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const letter = (name || "?").trim().charAt(0).toUpperCase() || "?";
  const box =
    size === "lg"
      ? "h-16 w-16 rounded-2xl text-lg sm:h-20 sm:w-20"
      : size === "sm"
        ? "h-11 w-11 rounded-xl text-[13px]"
        : "h-12 w-12 rounded-xl text-sm";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden border border-border bg-[#f8fafc] font-semibold text-body",
        box,
      )}
      aria-hidden
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-contain p-1" />
      ) : (
        letter
      )}
    </div>
  );
}
