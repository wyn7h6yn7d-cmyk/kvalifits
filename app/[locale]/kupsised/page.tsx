import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { LegalSiteShell } from "@/components/legal/LegalSiteShell";
import { getCookiePolicy, type LegalLocale } from "@/lib/content/legal";
import { legalPageMetadata } from "@/lib/content/legal/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const l = locale as LegalLocale;
  const doc = getCookiePolicy(l);
  return legalPageMetadata(doc, l);
}

export default async function KupsisedPage({ params }: Props) {
  const { locale } = await params;
  const l = locale as LegalLocale;
  const doc = getCookiePolicy(l);

  return (
    <LegalSiteShell>
      <LegalDocumentView doc={doc} showToc />
    </LegalSiteShell>
  );
}
