import { ContactPageView } from "@/components/legal/ContactPageView";
import { LegalSiteShell } from "@/components/legal/LegalSiteShell";
import { getContactPage, type LegalLocale } from "@/lib/content/legal";
import { legalPageMetadata } from "@/lib/content/legal/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const l = locale as LegalLocale;
  const content = getContactPage(l);
  return legalPageMetadata(content, l);
}

export default async function KontaktPage({ params }: Props) {
  const { locale } = await params;
  const l = locale as LegalLocale;
  const content = getContactPage(l);

  return (
    <LegalSiteShell>
      <ContactPageView content={content} />
    </LegalSiteShell>
  );
}
