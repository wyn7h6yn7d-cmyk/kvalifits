import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { LegalSiteShell } from "@/components/legal/LegalSiteShell";
import { getTerms, type LegalLocale } from "@/lib/content/legal";
import { legalPageMetadata } from "@/lib/content/legal/metadata";

const docPath = "/tingimused";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const l = locale as LegalLocale;
  const doc = getTerms(l);
  return legalPageMetadata(doc, l);
}

export default async function TingimusedPage({ params }: Props) {
  const { locale } = await params;
  const l = locale as LegalLocale;
  const doc = getTerms(l);

  return (
    <LegalSiteShell docPath={docPath}>
      <LegalDocumentView doc={doc} showToc />
    </LegalSiteShell>
  );
}
