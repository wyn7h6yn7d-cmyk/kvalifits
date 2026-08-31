import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { nativeSelectFormClassName } from "@/components/ui/controlStyles";
import { SITE_CONTROL_HEIGHT } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

const fieldLabelClass =
  "mb-1.5 block text-[0.9375rem] font-medium leading-snug text-foreground";

const actionClass = cn(SITE_CONTROL_HEIGHT, "w-full");

export function CompanySearchForm({
  q,
  industry,
  location,
  industries,
  locations,
  labels,
}: {
  q: string;
  industry: string;
  location: string;
  industries: string[];
  locations: string[];
  labels: {
    search: string;
    searchPlaceholder: string;
    industry: string;
    location: string;
    all: string;
    submit: string;
    reset: string;
  };
}) {
  const filtered = Boolean(q || industry || location);

  return (
    <form
      method="get"
      className="mx-auto grid w-full max-w-4xl items-end gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
    >
      <label className="block min-w-0 sm:col-span-2 lg:col-span-1">
        <span className={fieldLabelClass}>{labels.search}</span>
        <Input name="q" defaultValue={q} placeholder={labels.searchPlaceholder} />
      </label>
      <label className="block min-w-0">
        <span className={fieldLabelClass}>{labels.industry}</span>
        <select name="industry" defaultValue={industry} className={nativeSelectFormClassName()}>
          <option value="" className="bg-white">
            {labels.all}
          </option>
          {industries.map((v) => (
            <option key={v} value={v} className="bg-white">
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className="block min-w-0">
        <span className={fieldLabelClass}>{labels.location}</span>
        <select name="location" defaultValue={location} className={nativeSelectFormClassName()}>
          <option value="" className="bg-white">
            {labels.all}
          </option>
          {locations.map((v) => (
            <option key={v} value={v} className="bg-white">
              {v}
            </option>
          ))}
        </select>
      </label>
      <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:w-auto sm:items-end">
        <Button type="submit" variant="primary" className={actionClass}>
          {labels.submit}
        </Button>
        {filtered ? (
          <Button asChild variant="ghost" className={`${actionClass} px-4 text-body`}>
            <Link href="/ettevotted">{labels.reset}</Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}
