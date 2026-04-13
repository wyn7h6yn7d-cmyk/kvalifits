import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { LegalSiteShell } from "@/components/legal/LegalSiteShell";
import { getDataRightsPage, type LegalLocale } from "@/lib/content/legal";
import { legalPageMetadata } from "@/lib/content/legal/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const l = locale as LegalLocale;
  const doc = getDataRightsPage(l);
  return legalPageMetadata(doc, l);
}

export default async function AndmekaitsePage({ params }: Props) {
  const { locale } = await params;
  const l = locale as LegalLocale;
  const doc = getDataRightsPage(l);

  return (
    <LegalSiteShell>
      <LegalDocumentView doc={doc} showToc />
    </LegalSiteShell>
  );
}
