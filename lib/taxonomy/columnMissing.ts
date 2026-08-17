export function isTaxonomyColumnError(message: string | undefined): boolean {
  return /column|schema cache|does not exist/i.test(message ?? "");
}
