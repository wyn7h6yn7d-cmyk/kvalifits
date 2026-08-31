import { cn } from "@/lib/utils";
import { SITE_EYEBROW, SITE_H2_SECTION } from "@/lib/site/publicPageLayout";

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
        <div className={SITE_EYEBROW}>{eyebrow}</div>
      ) : null}
      <h2 className={cn("mt-3", SITE_H2_SECTION)}>{title}</h2>
      {subtitle ? (
        <p className="mt-3 text-base leading-[1.65] text-body">{subtitle}</p>
      ) : null}
    </div>
  );
}

