import { notFound } from "next/navigation";

import { QuickApplyA11yHarness } from "@/components/jobs/QuickApplyA11yHarness";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Quick apply a11y harness",
};

export default function QuickApplyA11yHarnessPage() {
  if (process.env.E2E_HARNESS !== "1" && process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center gap-4 p-6">
      <h1 className="text-sm font-medium text-white/70">Quick apply a11y harness</h1>
      <QuickApplyA11yHarness />
    </main>
  );
}
