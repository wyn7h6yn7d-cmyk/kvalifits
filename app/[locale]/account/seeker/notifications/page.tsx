import { redirect } from "next/navigation";

type Props = { params: Promise<{ locale: string }> };

/** Old URL was saved-search settings. Keep bookmarks working. */
export default async function SeekerNotificationsRedirect({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/account/seeker/alerts`);
}
