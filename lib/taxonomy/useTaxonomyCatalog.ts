"use client";

import { useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { catalogIsEmpty, loadTaxonomyCatalog } from "@/lib/taxonomy/loadCatalog";
import { EMPTY_TAXONOMY_CATALOG, type TaxonomyCatalog } from "@/lib/taxonomy/types";

export function useTaxonomyCatalog(): {
  catalog: TaxonomyCatalog;
  ready: boolean;
  available: boolean;
} {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [catalog, setCatalog] = useState<TaxonomyCatalog>(EMPTY_TAXONOMY_CATALOG);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void loadTaxonomyCatalog(supabase).then((next) => {
      if (!mounted) return;
      setCatalog(next);
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, [supabase]);

  return { catalog, ready, available: ready && !catalogIsEmpty(catalog) };
}
