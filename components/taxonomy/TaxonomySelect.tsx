"use client";

import { taxonomyLabel } from "@/lib/taxonomy/labels";
import type { TaxonomyTerm } from "@/lib/taxonomy/types";

const SELECT_CLASS =
  "h-11 w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 text-sm text-white/85 outline-none transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]";

export function TaxonomySelect({
  id,
  value,
  onChange,
  terms,
  locale,
  placeholder,
  required,
  disabled,
}: {
  id?: string;
  value: string;
  onChange: (id: string) => void;
  terms: TaxonomyTerm[];
  locale: string;
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      required={required}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={SELECT_CLASS}
    >
      <option value="">{placeholder}</option>
      {terms.map((term) => (
        <option key={term.id} value={term.id}>
          {taxonomyLabel(term, locale)}
        </option>
      ))}
    </select>
  );
}
