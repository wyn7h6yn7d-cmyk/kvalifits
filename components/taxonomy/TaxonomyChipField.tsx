"use client";

import { Chip } from "@/components/ui/chip";
import { taxonomyLabel } from "@/lib/taxonomy/labels";
import type { TaxonomyTerm } from "@/lib/taxonomy/types";

export function TaxonomyChipField({
  terms,
  selectedIds,
  leftover,
  onChangeIds,
  onChangeLeftover,
  locale,
  suggestedIds = [],
}: {
  terms: TaxonomyTerm[];
  selectedIds: string[];
  leftover: string[];
  onChangeIds: (ids: string[]) => void;
  onChangeLeftover: (values: string[]) => void;
  locale: string;
  suggestedIds?: string[];
}) {
  const selected = new Set(selectedIds);
  const suggested = new Set(suggestedIds);
  const ordered = [...terms].sort((a, b) => {
    const as = suggested.has(a.id) === selected.has(a.id) ? 0 : suggested.has(a.id) ? -1 : selected.has(a.id) ? -1 : 0;
    const bs = suggested.has(b.id) === selected.has(b.id) ? 0 : suggested.has(b.id) ? -1 : selected.has(b.id) ? -1 : 0;
    if (as !== bs) return as - bs;
    const aSel = selected.has(a.id) ? 0 : 1;
    const bSel = selected.has(b.id) ? 0 : 1;
    if (aSel !== bSel) return aSel - bSel;
    return a.sort_order - b.sort_order;
  });

  function toggle(id: string) {
    if (selected.has(id)) onChangeIds(selectedIds.filter((x) => x !== id));
    else onChangeIds([...selectedIds, id]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ordered.map((term) => (
        <Chip
          key={term.id}
          label={taxonomyLabel(term, locale)}
          selected={selected.has(term.id)}
          tone={suggested.has(term.id) ? "violet" : "default"}
          onClick={() => toggle(term.id)}
        />
      ))}
      {leftover.map((value) => (
        <Chip
          key={`leftover:${value}`}
          label={value}
          selected
          onRemove={() => onChangeLeftover(leftover.filter((x) => x !== value))}
        />
      ))}
    </div>
  );
}
