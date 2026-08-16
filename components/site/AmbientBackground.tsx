"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

export function AmbientBackground({
  className,
  intensity = "default",
}: {
  className?: string;
  intensity?: "soft" | "default" | "strong";
}) {
  const reduce = useReducedMotion();
  // Softer caps — premium glow without eye strain
  const a =
    intensity === "soft" ? 0.10 : intensity === "strong" ? 0.32 : 0.18;
  const b =
    intensity === "soft" ? 0.06 : intensity === "strong" ? 0.18 : 0.10;

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {/* ambient glows — violet kept controlled */}
      <motion.div
        className="absolute -top-44 left-1/2 h-[620px] w-[980px] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(168,85,247,0.38), rgba(99,102,241,0.12), rgba(9,9,13,0) 72%)",
          opacity: a,
        }}
        animate={
          reduce
            ? undefined
            : {
                x: ["-50%", "-48%", "-52%", "-50%"],
                y: [-8, 6, -10, -8],
                scale: [1, 1.03, 0.99, 1],
              }
        }
        transition={
          reduce
            ? undefined
            : { duration: 18, ease: "easeInOut", repeat: Infinity }
        }
      />

      <motion.div
        className="absolute -bottom-48 right-[-140px] h-[520px] w-[620px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 40% 40%, rgba(227,31,141,0.12), rgba(168,85,247,0.08), rgba(9,9,13,0) 72%)",
          opacity: b,
        }}
        animate={
          reduce
            ? undefined
            : {
                x: [0, -18, 10, 0],
                y: [0, -10, 8, 0],
                scale: [1, 1.04, 1.0, 1],
              }
        }
        transition={
          reduce
            ? undefined
            : { duration: 22, ease: "easeInOut", repeat: Infinity }
        }
      />
    </div>
  );
}
