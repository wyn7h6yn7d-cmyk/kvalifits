import { AccountCalmLoadingFrame } from "@/components/skeletons/AccountLoadingFrame";
import { CandidateListSkeleton } from "@/components/skeletons/CandidateListSkeleton";

export default function EmployerApplicantsLoading() {
  return (
    <AccountCalmLoadingFrame maxWidthClassName="max-w-7xl">
      <CandidateListSkeleton />
    </AccountCalmLoadingFrame>
  );
}
