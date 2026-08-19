export const DEFAULT_PAGE_SIZE = 25;

export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type PaginatedResult<T> = {
  rows: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export function parsePaginationParams(
  sp: Record<string, string | string[] | undefined>,
  pageSize = DEFAULT_PAGE_SIZE,
): PaginationParams {
  const raw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const parsed = parseInt(raw ?? "1", 10);
  const page = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
  return { page, pageSize };
}

export function paginationRange(params: PaginationParams): { from: number; to: number } {
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;
  return { from, to };
}

export function buildPaginatedResult<T>(
  rows: T[],
  totalCount: number,
  params: PaginationParams,
): PaginatedResult<T> {
  const totalPages = Math.max(1, Math.ceil(totalCount / params.pageSize));
  const page = Math.min(params.page, totalPages);
  return { rows, page, pageSize: params.pageSize, totalCount, totalPages };
}

export function paginationSearchParams(
  current: Record<string, string | string[] | undefined>,
  page: number,
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    if (k === "page") continue;
    const val = Array.isArray(v) ? v[0] : v;
    if (val) sp.set(k, val);
  }
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}
