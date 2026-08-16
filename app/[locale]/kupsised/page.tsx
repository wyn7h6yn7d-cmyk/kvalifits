import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { LegalSiteShell } from "@/components/legal/LegalSiteShell";
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
    <LegalSiteShell>
      <div className="mx-auto max-w-3xl px-4 pt-4 sm:px-6">
        <CookieSettingsButton className="text-sm font-medium text-white/70 underline-offset-4 hover:text-white hover:underline" />
      </div>
      <LegalDocumentView doc={doc} showToc />
    </LegalSiteShell>
  );
}
