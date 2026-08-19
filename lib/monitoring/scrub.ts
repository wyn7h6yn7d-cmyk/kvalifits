const FILTERED = "[Filtered]";

const SENSITIVE_KEY_RE =
  /^(password|passwd|pwd|token|authorization|cookie|cookies|secret|apikey|api_key|service_role|access_token|refresh_token|id_token|html|email|phone|cv|resume|certificate|certificates|cover_letter|coverletter|note_for_employer|noteforemployer|application_answers|applicationanswers|work_capacity|workcapacity|health|date_of_birth|dateofbirth|cv_url|cv_file|body)$/i;

const SENSITIVE_KEY_PART_RE =
  /(password|passwd|secret|token|authorization|cookie|api[_-]?key|service[_-]?role|resume|certificate|cover[_-]?letter|note[_-]?for[_-]?employer|application[_-]?answers|work[_-]?capacity|date[_-]?of[_-]?birth|cv[_-]?(url|file|path)|email|phone)/i;

const QUERY_TOKEN_RE = /\b(access_token|refresh_token|id_token|token|code|apikey|api_key)\b/i;

export function isSensitiveKey(key: string): boolean {
  const compact = key.replace(/[-_\s]/g, "");
  return SENSITIVE_KEY_RE.test(key) || SENSITIVE_KEY_RE.test(compact) || SENSITIVE_KEY_PART_RE.test(key);
}

export function redactQueryString(query: string | null | undefined): string | undefined {
  if (query == null || query === "") return query ?? undefined;
  try {
    const params = new URLSearchParams(query.startsWith("?") ? query.slice(1) : query);
    let changed = false;
    for (const key of [...params.keys()]) {
      if (QUERY_TOKEN_RE.test(key) || isSensitiveKey(key)) {
        params.set(key, FILTERED);
        changed = true;
      }
    }
    return changed ? params.toString() : query;
  } catch {
    return FILTERED;
  }
}

export function scrubValue(value: unknown, key?: string): unknown {
  if (key && isSensitiveKey(key)) return FILTERED;
  if (value == null) return value;
  if (typeof value === "string") return value;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => scrubValue(item));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = scrubValue(v, k);
  }
  return out;
}

type ScrubbableEvent = {
  user?: {
    id?: string | number;
    email?: string | null;
    ip_address?: string | null;
    username?: string | null;
    [key: string]: unknown;
  } | null;
  request?: {
    cookies?: unknown;
    data?: unknown;
    headers?: Record<string, unknown> | null;
    query_string?: string | null;
    url?: string;
    [key: string]: unknown;
  } | null;
  extra?: Record<string, unknown> | null;
  contexts?: Record<string, unknown> | null;
  breadcrumbs?: Array<{ data?: Record<string, unknown>; [key: string]: unknown }> | null;
};

function scrubHeaders(headers: Record<string, unknown> | null | undefined): Record<string, unknown> | undefined {
  if (!headers) return headers ?? undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(headers)) {
    out[k] = isSensitiveKey(k) || /^(cookie|authorization|x-api-key|apikey)$/i.test(k) ? FILTERED : v;
  }
  return out;
}

/**
 * Drop secrets, CV/certificate payloads, health fields, and contact PII
 * before an event leaves the process. Safe to run when Sentry is disabled.
 */
export function scrubSentryEvent<T>(event: T): T {
  const payload = event as ScrubbableEvent;
  if (payload.user) {
    const id = payload.user.id;
    payload.user = {
      id: id == null ? undefined : String(id),
    };
  }

  if (payload.request) {
    const url = payload.request.url;
    let safeUrl = url;
    if (typeof url === "string") {
      try {
        const parsed = new URL(url);
        parsed.search = redactQueryString(parsed.search) ?? "";
        safeUrl = parsed.toString();
      } catch {
        safeUrl = url.split("?")[0];
      }
    }
    payload.request = {
      ...payload.request,
      url: safeUrl,
      cookies: undefined,
      data: undefined,
      headers: scrubHeaders(payload.request.headers),
      query_string: redactQueryString(payload.request.query_string ?? undefined),
    };
  }

  if (payload.extra) {
    payload.extra = scrubValue(payload.extra) as Record<string, unknown>;
  }
  if (payload.contexts) {
    payload.contexts = scrubValue(payload.contexts) as Record<string, unknown>;
  }
  if (payload.breadcrumbs) {
    payload.breadcrumbs = payload.breadcrumbs.map((crumb) => ({
      ...crumb,
      data: crumb.data ? (scrubValue(crumb.data) as Record<string, unknown>) : crumb.data,
    }));
  }

  return event;
}
