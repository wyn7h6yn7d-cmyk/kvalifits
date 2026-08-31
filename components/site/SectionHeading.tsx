import { cn } from "@/lib/utils";
import { SITE_BODY_LEAD, SITE_EYEBROW, SITE_H2_SECTION } from "@/lib/site/publicPageLayout";

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
      <h2 className={cn("mt-4", SITE_H2_SECTION)}>{title}</h2>
      {subtitle ? (
        <p className={cn("mt-4 max-w-[34rem] text-pretty", SITE_BODY_LEAD)}>{subtitle}</p>
      ) : null}
    </div>
  );
}

