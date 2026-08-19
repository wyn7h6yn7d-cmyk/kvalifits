import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function omitKeys<T extends object, K extends string>(obj: T, keys: readonly K[]): Omit<T, K> {
  const next = { ...obj } as Record<string, unknown>;
  for (const key of keys) {
    delete next[key];
  }
  return next as Omit<T, K>;
}

/** Supabase `PostgrestError` and similar objects often are not `instanceof Error`. */
export function errorMessageFromUnknown(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  if (typeof err === "object" && err !== null) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return fallback;
}

/** Allow only http(s) URLs (e.g. shared profile snapshots, public file URLs). */
export function safeHttpUrl(raw: unknown): string | null {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

