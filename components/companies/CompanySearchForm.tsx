import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { nativeSelectFormClassName } from "@/components/ui/controlStyles";
import { cn } from "@/lib/utils";

const fieldLabelClass =
  "mb-2 block text-[0.9375rem] font-medium leading-snug text-foreground sm:text-base";

const controlClass = "h-11 sm:h-12";

export function CompanySearchForm({
  q,
  industry,
  location,
  industries,
  locations,
  labels,
  className,
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
  className?: string;
}) {
  const filtered = Boolean(q || industry || location);

  return (
    <form
      method="get"
      className={cn(
        "grid w-full items-end gap-4",
        "lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:gap-3 xl:gap-4",
        className,
      )}
    >
      <label className="block min-w-0">
        <span className={fieldLabelClass}>{labels.search}</span>
        <Input
          name="q"
          defaultValue={q}
          placeholder={labels.searchPlaceholder}
          className={controlClass}
        />
      </label>
      <label className="block min-w-0">
        <span className={fieldLabelClass}>{labels.industry}</span>
        <select
          name="industry"
          defaultValue={industry}
          className={nativeSelectFormClassName(cn(controlClass, "text-[0.9375rem] sm:text-base"))}
        >
          <option value="">{labels.all}</option>
          {industries.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className="block min-w-0">
        <span className={fieldLabelClass}>{labels.location}</span>
        <select
          name="location"
          defaultValue={location}
          className={nativeSelectFormClassName(cn(controlClass, "text-[0.9375rem] sm:text-base"))}
        >
          <option value="">{labels.all}</option>
          {locations.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row lg:w-auto lg:flex-row lg:items-end">
        <Button type="submit" variant="primary" className={cn(controlClass, "w-full px-6 sm:px-7 lg:w-auto")}>
          {labels.submit}
        </Button>
        {filtered ? (
          <Button asChild variant="ghost" className={cn(controlClass, "w-full px-4 text-body lg:w-auto")}>
            <Link href="/ettevotted">{labels.reset}</Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}
