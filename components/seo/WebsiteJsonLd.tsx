import { jsonLdScriptHtml, websiteJsonLd } from "@/lib/seo/site";

/** Single WebSite JSON-LD block for homepage brand / site-name signals. */
export function WebsiteJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdScriptHtml(websiteJsonLd()) }}
    />
  );
}
