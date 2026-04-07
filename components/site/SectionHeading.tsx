import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow ? (
        <div className="text-xs font-medium tracking-[0.22em] uppercase text-white/55">
          {eyebrow}
        </div>
      ) : null}
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 text-base leading-7 text-white/70">{subtitle}</p>
      ) : null}
    </div>
  );
}

