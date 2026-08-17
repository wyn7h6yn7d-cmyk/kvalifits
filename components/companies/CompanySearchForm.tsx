import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

const selectClass =
  "h-12 w-full rounded-2xl border border-white/[0.10] bg-[#12121a] px-4 text-base text-white/85 outline-none focus:border-white/[0.18] lg:h-11 lg:text-sm";

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
    <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="block min-w-0 sm:col-span-2 lg:col-span-1">
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-white/40">
          {labels.search}
        </span>
        <Input name="q" defaultValue={q} placeholder={labels.searchPlaceholder} />
      </label>
      <label className="block min-w-0">
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-white/40">
          {labels.industry}
        </span>
        <select name="industry" defaultValue={industry} className={selectClass}>
          <option value="" className="bg-zinc-900">
            {labels.all}
          </option>
          {industries.map((v) => (
            <option key={v} value={v} className="bg-zinc-900">
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className="block min-w-0">
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-white/40">
          {labels.location}
        </span>
        <select name="location" defaultValue={location} className={selectClass}>
          <option value="" className="bg-zinc-900">
            {labels.all}
          </option>
          {locations.map((v) => (
            <option key={v} value={v} className="bg-zinc-900">
              {v}
            </option>
          ))}
        </select>
      </label>
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-end">
        <Button type="submit" variant="primary" className="h-12 w-full rounded-2xl px-5 sm:h-11 sm:w-auto">
          {labels.submit}
        </Button>
        {filtered ? (
          <Button asChild variant="ghost" className="h-12 w-full rounded-2xl px-4 text-white/70 sm:h-11 sm:w-auto">
            <Link href="/ettevotted">{labels.reset}</Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}
