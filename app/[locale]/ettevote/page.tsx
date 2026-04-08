import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { LegalSiteShell } from "@/components/legal/LegalSiteShell";
import { getCompanyPage, type LegalLocale } from "@/lib/content/legal";
import { legalPageMetadata } from "@/lib/content/legal/metadata";

const docPath = "/ettevote";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const l = locale as LegalLocale;
  const doc = getCompanyPage(l);
  return legalPageMetadata(doc, l);
}

export default async function EttevotePage({ params }: Props) {
  const { locale } = await params;
  const l = locale as LegalLocale;
  const doc = getCompanyPage(l);
  const prose = {
    h1: doc.h1,
    lead: doc.lead,
    lastUpdated: doc.lastUpdated,
    sections: doc.sections,
  };

  return (
    <LegalSiteShell docPath={docPath}>
      <LegalDocumentView doc={prose} showToc={false} />
    </LegalSiteShell>
  );
}
