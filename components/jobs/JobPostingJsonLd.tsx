import { jsonLdScriptHtml } from "@/lib/seo/site";

/** Renders Google JobPosting JSON-LD when structured data could be built. */
export function JobPostingJsonLd({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdScriptHtml(data) }}
    />
  );
}
