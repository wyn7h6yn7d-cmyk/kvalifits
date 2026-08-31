import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { CookieSettingsButton } from "@/components/cookies/CookieSettingsButton";
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
    <LegalDocumentView
      doc={doc}
      showToc
      prepend={
        <CookieSettingsButton className="text-sm font-medium text-body underline-offset-4 hover:text-foreground hover:underline" />
      }
    />
  );
}
