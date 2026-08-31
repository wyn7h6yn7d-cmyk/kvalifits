import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/routing";
import { SITE_CONTROL_HEIGHT, SITE_H2_SECTION } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

export async function FinalCTA() {
  const t = await getTranslations("finalCta");

  return (
    <section
      id="registreeru"
      className="scroll-mt-[var(--site-header-offset)] border-t border-border py-10 sm:py-12"
    >
      <Container>
        <div className="mx-auto max-w-xl text-center">
          <h2 className={SITE_H2_SECTION}>{t("title")}</h2>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              variant="primary"
              className={cn(SITE_CONTROL_HEIGHT, "w-full min-w-0 justify-center sm:w-auto")}
            >
              <Link href="/tood">{t("ctaSeeker")}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className={cn(SITE_CONTROL_HEIGHT, "w-full min-w-0 justify-center sm:w-auto")}
            >
              <Link href="/auth/register?role=employer">{t("ctaEmployer")}</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
