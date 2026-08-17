import { AccountAuthLoadingFrame } from "@/components/skeletons/AccountLoadingFrame";
import { ApplicationListSkeleton } from "@/components/skeletons/ApplicationListSkeleton";

export default function SeekerApplicationsLoading() {
  return (
    <AccountAuthLoadingFrame maxWidthClassName="max-w-3xl">
      <ApplicationListSkeleton />
    </AccountAuthLoadingFrame>
  );
}
