"use client";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/redux/hooks";

// Compulsory slugs are always active — no need to fetch them from the server.
const ALWAYS_ACTIVE = ["auth", "school", "students", "teachers", "parents", "classes"];

let cachedSlugs: string[] | null = null;
let fetchPromise: Promise<string[]> | null = null;

async function fetchActiveSlugs(): Promise<string[]> {
  if (cachedSlugs) return cachedSlugs;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch("/api/services", { credentials: "include" })
    .then((r) => r.json())
    .then((data) => {
      if (!data || !Array.isArray(data.data)) return ALWAYS_ACTIVE;
      const active = data.data
        .filter((s: any) => s.is_compulsory === 1 || s.subscription_status === "active")
        .map((s: any) => s.slug as string);
      cachedSlugs = active;
      return active;
    })
    .catch(() => ALWAYS_ACTIVE)
    .finally(() => { fetchPromise = null; });

  return fetchPromise;
}

/** Invalidate the in-memory cache (e.g. after subscribe/unsubscribe). */
export function invalidateServiceCache() {
  cachedSlugs = null;
  fetchPromise = null;
}

/**
 * Returns { activeServices, loading }.
 * `activeServices` is a Set of slug strings that are active for this school.
 */
export function useActiveServices() {
  const { user } = useAppSelector((s) => s.auth);
  const [activeServices, setActiveServices] = useState<Set<string>>(new Set(ALWAYS_ACTIVE));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Super-admins bypass service gating
    if (!user || user.role === "super_admin") {
      setLoading(false);
      return;
    }

    fetchActiveSlugs()
      .then((slugs) => setActiveServices(new Set(slugs)))
      .finally(() => setLoading(false));
  }, [user]);

  const hasService = (slug: string) =>
    user?.role === "super_admin" || activeServices.has(slug);

  return { activeServices, hasService, loading };
}
