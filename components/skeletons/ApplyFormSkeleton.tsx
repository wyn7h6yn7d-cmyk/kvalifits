import { Bone, SkeletonRegion } from "@/components/ui/Skeleton";

export function ApplyFormSkeleton({ label }: { label?: string }) {
  return (
    <SkeletonRegion label={label}>
      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
        <Bone className="h-4 w-40" />
        <Bone className="mt-3 h-11 w-full rounded-xl" />
        <Bone className="mt-3 h-11 w-full rounded-xl" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Bone className="h-11 w-full rounded-xl" />
          <Bone className="h-11 w-full rounded-xl" />
        </div>
        <Bone className="mt-3 h-24 w-full rounded-xl" />
        <Bone className="mt-4 h-11 w-36 rounded-xl" />
      </div>
    </SkeletonRegion>
  );
}
