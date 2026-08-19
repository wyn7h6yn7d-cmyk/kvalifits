import type { SupabaseClient } from "@supabase/supabase-js";

import {
  adminAuditQuerySpec,
  adminAuditTotalPages,
  formatAuditSummaryLine,
  isAuditActorUuid,
  summarizeAuditDetails,
  type AdminAuditFilters,
} from "@/lib/admin/auditLogView";

export const ADMIN_AUDIT_SELECT =
  "id,actor_id,action,target_type,target_id,details,timestamp";

export type AdminAuditLogRow = {
  id: string;
  timestamp: string;
  actorId: string;
  actorLabel: string;
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
};

export type AdminAuditLogPage = {
  rows: AdminAuditLogRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  schemaMissing: boolean;
  actorUnresolved: boolean;
};

function emptyPage(
  page: number,
  pageSize: number,
  extras?: Partial<Pick<AdminAuditLogPage, "schemaMissing" | "actorUnresolved">>,
): AdminAuditLogPage {
  return {
    rows: [],
    total: 0,
    page,
    pageSize,
    totalPages: 1,
    schemaMissing: extras?.schemaMissing ?? false,
    actorUnresolved: extras?.actorUnresolved ?? false,
  };
}

function isMissingAuditTable(message: string | undefined): boolean {
  return /admin_audit_log|does not exist|schema cache|relation|could not find/i.test(
    message ?? "",
  );
}

function escapeIlikeExact(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

async function resolveActorId(
  supabase: SupabaseClient,
  actor: string,
): Promise<string | null> {
  if (isAuditActorUuid(actor)) return actor.trim();

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", escapeIlikeExact(actor.trim()))
    .limit(1);

  if (error || !data?.[0]?.id) return null;
  return String(data[0].id);
}

function asRecord(row: unknown): Record<string, unknown> {
  return row && typeof row === "object" ? (row as Record<string, unknown>) : {};
}

function str(row: Record<string, unknown>, key: string): string {
  const v = row[key];
  return v == null ? "" : String(v);
}

export async function loadAdminAuditLog(
  supabase: SupabaseClient,
  filters: AdminAuditFilters,
): Promise<AdminAuditLogPage> {
  const spec = adminAuditQuerySpec(filters);

  let actorId: string | null = null;
  if (filters.actor) {
    actorId = await resolveActorId(supabase, filters.actor);
    if (!actorId) return emptyPage(spec.page, spec.pageSize, { actorUnresolved: true });
  }

  let query = supabase
    .from("admin_audit_log")
    .select(ADMIN_AUDIT_SELECT, { count: "exact" });

  if (spec.action) query = query.eq("action", spec.action);
  if (spec.targetType) query = query.eq("target_type", spec.targetType);
  if (actorId) query = query.eq("actor_id", actorId);
  if (spec.timestampGte) query = query.gte("timestamp", spec.timestampGte);
  if (spec.timestampLt) query = query.lt("timestamp", spec.timestampLt);

  const { data, error, count } = await query
    .order("timestamp", { ascending: false })
    .range(spec.rangeFrom, spec.rangeTo);

  if (error) {
    return emptyPage(spec.page, spec.pageSize, {
      schemaMissing: isMissingAuditTable(error.message),
    });
  }

  const rawRows = Array.isArray(data) ? data : [];
  const actorIds = Array.from(
    new Set(rawRows.map((row) => str(asRecord(row), "actor_id")).filter(Boolean)),
  );

  const emailById = new Map<string, string>();
  if (actorIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,email")
      .in("id", actorIds);
    for (const profile of profiles ?? []) {
      const rec = asRecord(profile);
      const id = str(rec, "id");
      const email = str(rec, "email").trim();
      if (id && email) emailById.set(id, email);
    }
  }

  const rows: AdminAuditLogRow[] = rawRows.map((item) => {
    const rec = asRecord(item);
    const actor = str(rec, "actor_id");
    const targetId = str(rec, "target_id");
    return {
      id: str(rec, "id"),
      timestamp: str(rec, "timestamp"),
      actorId: actor,
      actorLabel: emailById.get(actor) || actor,
      action: str(rec, "action"),
      targetType: str(rec, "target_type"),
      targetId,
      summary: formatAuditSummaryLine(summarizeAuditDetails(rec.details)),
    };
  });

  const total = typeof count === "number" && count >= 0 ? count : rows.length;
  return {
    rows,
    total,
    page: spec.page,
    pageSize: spec.pageSize,
    totalPages: adminAuditTotalPages(total, spec.pageSize),
    schemaMissing: false,
    actorUnresolved: false,
  };
}
