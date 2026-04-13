import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { LegalSiteShell } from "@/components/legal/LegalSiteShell";
import { getPrivacyPolicy, type LegalLocale } from "@/lib/content/legal";
import { legalPageMetadata } from "@/lib/content/legal/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const l = locale as LegalLocale;
  const doc = getPrivacyPolicy(l);
  return legalPageMetadata(doc, l);
}

export default async function PrivaatsusPage({ params }: Props) {
  const { locale } = await params;
  const l = locale as LegalLocale;
  const doc = getPrivacyPolicy(l);

  return (
    <LegalSiteShell>
      <LegalDocumentView doc={doc} showToc />
    </LegalSiteShell>
  );
}
