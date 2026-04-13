/** Lightweight placeholder while below-the-fold homepage chunks load. */
export function BelowFoldSectionSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-6xl animate-pulse rounded-3xl border border-white/[0.06] bg-white/[0.02] px-6 py-16 sm:py-20"
      aria-hidden
    >
      <div className="mx-auto h-4 max-w-xs rounded-full bg-white/[0.08]" />
      <div className="mx-auto mt-6 h-9 max-w-lg rounded-lg bg-white/[0.06]" />
      <div className="mx-auto mt-4 h-4 max-w-2xl rounded-full bg-white/[0.05]" />
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="h-40 rounded-2xl bg-white/[0.04]" />
        <div className="h-40 rounded-2xl bg-white/[0.04]" />
        <div className="h-40 rounded-2xl bg-white/[0.04]" />
      </div>
    </div>
  );
}
