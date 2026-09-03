import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import {
  pickClientMessages,
  pickSiteClientMessages,
  type ClientMessageNamespace,
} from "@/lib/i18n/clientMessages";

/**
 * Nested provider that replaces layout messages with a route-scoped pick.
 * Server components still use full messages via getTranslations.
 */
export async function ClientMessagesProvider({
  namespaces,
  mode = "namespaces",
  children,
}: {
  namespaces?: readonly ClientMessageNamespace[] | readonly string[];
  mode?: "namespaces" | "site";
  children: ReactNode;
}) {
  const all = await getMessages();
  const messages =
    mode === "site"
      ? pickSiteClientMessages(all)
      : pickClientMessages(all, namespaces ?? []);
  return <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>;
}
