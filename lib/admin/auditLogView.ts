import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_TARGET_TYPES,
} from "@/lib/admin/auditLog";
import { isSensitiveKey } from "@/lib/monitoring/scrub";

export { ADMIN_AUDIT_TARGET_TYPES };

export const ADMIN_AUDIT_PATH = "/admin/audit";
export const ADMIN_AUDIT_PAGE_SIZE = 25;
const MAX_PAGE = 10_000;
const MAX_ACTOR_LEN = 200;
const MAX_SUMMARY_PAIRS = 6;
const MAX_SUMMARY_VALUE_LEN = 80;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTION_RE = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const ADMIN_AUDIT_ACTION_OPTIONS = Object.values(ADMIN_AUDIT_ACTIONS).sort();

export type AdminAuditFilters = {
  action: string | null;
  actor: string | null;
  targetType: string | null;
  from: string | null;
  to: string | null;
  page: number;
};

export type AdminAuditQuerySpec = {
  action: string | null;
  targetType: string | null;
  timestampGte: string | null;
  timestampLt: string | null;
  rangeFrom: number;
  rangeTo: number;
  page: number;
  pageSize: number;
};

export type AuditDetailPair = { key: string; value: string };

function getOne(
  input: URLSearchParams | Readonly<Record<string, string | string[] | undefined>>,
  key: string,
): string | undefined {
  if (input instanceof URLSearchParams) {
    const v = input.get(key);
    return v?.trim() || undefined;
  }
  const raw = input[key];
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v?.trim() || undefined;
}

export function isAuditActorUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

function parseDateParam(raw: string | undefined): string | null {
  if (!raw || !DATE_RE.test(raw)) return null;
  const [y, m, d] = raw.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return null;
  }
  return raw;
}

function parseAction(raw: string | undefined): string | null {
  if (!raw) return null;
  if ((ADMIN_AUDIT_ACTION_OPTIONS as string[]).includes(raw)) return raw;
  if (raw.length <= 80 && ACTION_RE.test(raw)) return raw;
  return null;
}

function parseTargetType(raw: string | undefined): string | null {
  if (!raw) return null;
  return (ADMIN_AUDIT_TARGET_TYPES as readonly string[]).includes(raw) ? raw : null;
}

function parseActor(raw: string | undefined): string | null {
  const s = (raw ?? "").trim();
  if (!s || s.length > MAX_ACTOR_LEN) return null;
  return s;
}

function parsePage(raw: string | undefined): number {
  const n = Number(raw ?? "1");
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_PAGE, Math.max(1, Math.floor(n)));
}

export function parseAdminAuditParams(
  input: URLSearchParams | Readonly<Record<string, string | string[] | undefined>>,
): AdminAuditFilters {
  return {
    action: parseAction(getOne(input, "action")),
    actor: parseActor(getOne(input, "actor")),
    targetType: parseTargetType(getOne(input, "type") ?? getOne(input, "target_type")),
    from: parseDateParam(getOne(input, "from")),
    to: parseDateParam(getOne(input, "to")),
    page: parsePage(getOne(input, "page")),
  };
}

export function buildAdminAuditLogUrl(filters: Partial<AdminAuditFilters>): string {
  const sp = new URLSearchParams();
  const action = filters.action?.trim() || null;
  const actor = filters.actor?.trim() || null;
  const targetType = filters.targetType?.trim() || null;
  const from = filters.from?.trim() || null;
  const to = filters.to?.trim() || null;
  const page = filters.page && filters.page > 1 ? Math.floor(filters.page) : 1;
  if (action) sp.set("action", action);
  if (actor) sp.set("actor", actor);
  if (targetType) sp.set("type", targetType);
  if (from) sp.set("from", from);
  if (to) sp.set("to", to);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `${ADMIN_AUDIT_PATH}?${qs}` : ADMIN_AUDIT_PATH;
}

export function nextUtcDateIso(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString();
}

export function adminAuditQuerySpec(filters: AdminAuditFilters): AdminAuditQuerySpec {
  const page = Math.min(MAX_PAGE, Math.max(1, Math.floor(filters.page) || 1));
  const rangeFrom = (page - 1) * ADMIN_AUDIT_PAGE_SIZE;
  return {
    action: filters.action,
    targetType: filters.targetType,
    timestampGte: filters.from ? `${filters.from}T00:00:00.000Z` : null,
    timestampLt: filters.to ? nextUtcDateIso(filters.to) : null,
    rangeFrom,
    rangeTo: rangeFrom + ADMIN_AUDIT_PAGE_SIZE - 1,
    page,
    pageSize: ADMIN_AUDIT_PAGE_SIZE,
  };
}

export function adminAuditTotalPages(total: number, pageSize = ADMIN_AUDIT_PAGE_SIZE): number {
  if (total <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

function looksLikeDocumentPayload(value: string): boolean {
  const s = value.trim();
  return (
    /^(data:|-----BEGIN)/i.test(s) ||
    /<\/?[a-z][\s\S]*>/i.test(s) ||
    s.length > 400
  );
}

function formatSafeDetailValue(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.replace(/\s+/g, " ").trim();
    if (!trimmed || looksLikeDocumentPayload(trimmed)) return null;
    return trimmed.length > MAX_SUMMARY_VALUE_LEN
      ? `${trimmed.slice(0, MAX_SUMMARY_VALUE_LEN)}…`
      : trimmed;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) {
    const parts: string[] = [];
    for (const item of value) {
      if (typeof item !== "string" && typeof item !== "number" && typeof item !== "boolean") continue;
      const text = formatSafeDetailValue(item);
      if (!text) continue;
      parts.push(text);
      if (parts.length >= 4) break;
    }
    if (!parts.length) return null;
    const joined = parts.join(", ");
    return joined.length > MAX_SUMMARY_VALUE_LEN
      ? `${joined.slice(0, MAX_SUMMARY_VALUE_LEN)}…`
      : joined;
  }
  return null;
}

/** Flatten jsonb details into short key=value pairs. Secrets and document bodies are omitted. */
export function summarizeAuditDetails(details: unknown): AuditDetailPair[] {
  if (!details || typeof details !== "object" || Array.isArray(details)) return [];
  const out: AuditDetailPair[] = [];
  for (const [key, raw] of Object.entries(details as Record<string, unknown>)) {
    if (!key || isSensitiveKey(key)) continue;
    const value = formatSafeDetailValue(raw);
    if (!value) continue;
    out.push({ key, value });
    if (out.length >= MAX_SUMMARY_PAIRS) break;
  }
  return out;
}

export function formatAuditSummaryLine(pairs: AuditDetailPair[]): string {
  if (!pairs.length) return "";
  return pairs.map((p) => `${p.key}=${p.value}`).join(" · ");
}

export function shortenAuditId(id: string): string {
  const s = id.trim();
  if (s.length <= 16) return s || "—";
  return `${s.slice(0, 8)}…${s.slice(-4)}`;
}
