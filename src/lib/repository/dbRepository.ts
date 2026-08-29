import { emptyState } from "@/lib/domain/seed";
import type { Db } from "@/lib/domain/types";

const CACHE_KEY = "logbook.cache.v1";

/**
 * Storage adapter the store talks to. The UI never touches this directly —
 * swap the implementation (a different backend, a test double) without
 * touching store or component code.
 */
export interface DbRepository {
  /** Loads current state from the server; falls back to the last-known
   * local cache (then a fresh empty state) if the network is unreachable. */
  load(): Promise<Db>;
  /** Persists state to the server and refreshes the local offline cache. */
  save(db: Db): Promise<boolean>;
  /** Replaces server + local state with a brand-new empty account. */
  reset(): Promise<Db>;
}

function cacheLocally(db: Db) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(db));
  } catch {
    // ignore quota errors — the cache is best-effort
  }
}

function readCache(): Db | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Db> | null;
    return parsed && parsed.profile ? (parsed as Db) : null;
  } catch {
    return null;
  }
}

class HttpDbRepository implements DbRepository {
  async load(): Promise<Db> {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) throw new Error(`GET /api/state -> ${res.status}`);
      const db = (await res.json()) as Db;
      cacheLocally(db);
      return db;
    } catch {
      return readCache() ?? emptyState();
    }
  }

  async save(db: Db): Promise<boolean> {
    cacheLocally(db);
    try {
      const res = await fetch("/api/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(db),
        keepalive: true,
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async reset(): Promise<Db> {
    const fresh = emptyState();
    await this.save(fresh);
    return fresh;
  }
}

export const dbRepository: DbRepository = new HttpDbRepository();
