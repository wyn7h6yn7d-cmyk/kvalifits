import { cn } from "@/lib/utils";

export function AmbientBackground({
  className,
  intensity = "default",
}: {
  className?: string;
  intensity?: "soft" | "default" | "strong";
}) {
  const a = intensity === "soft" ? 0.1 : intensity === "strong" ? 0.32 : 0.18;
  const b = intensity === "soft" ? 0.06 : intensity === "strong" ? 0.18 : 0.1;

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div
        className="kf-ambient-orb absolute -top-44 left-1/2 h-[360px] w-[520px] -translate-x-1/2 rounded-full blur-2xl lg:h-[520px] lg:w-[820px]"
        style={{
          opacity: a,
          background:
            "radial-gradient(circle at 50% 50%, rgba(168,85,247,0.38), rgba(99,102,241,0.12), rgba(9,9,13,0) 72%)",
        }}
      />
      <div
        className="kf-ambient-orb-b absolute -bottom-48 right-[-140px] hidden h-[420px] w-[500px] rounded-full blur-2xl lg:block"
        style={{
          opacity: b,
          background:
            "radial-gradient(circle at 40% 40%, rgba(227,31,141,0.12), rgba(168,85,247,0.08), rgba(9,9,13,0) 72%)",
        }}
      />
    </div>
  );
}
