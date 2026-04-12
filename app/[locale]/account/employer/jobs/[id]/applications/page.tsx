import { redirect } from "next/navigation";

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function EmployerJobApplicationsRedirect({ params }: Props) {
  const { locale, id } = await params;
  redirect(`/${locale}/account/employer/jobs/${id}/applicants`);
}
