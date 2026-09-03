import { getTranslations } from "next-intl/server";

import { FaqPageContent } from "@/components/sections/FaqPageContent";
import { publicPageMetadata } from "@/lib/seo/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.faq" });
  return publicPageMetadata({
    locale,
    path: "/kkk",
    title: t("title"),
    description: t("description"),
  });
}

export default async function KkkPage() {
  return <FaqPageContent />;
}
