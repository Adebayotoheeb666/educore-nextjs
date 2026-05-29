"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActiveServices } from "./useActiveServices";

/**
 * Page-level service guard.
 * Redirects to /service-inactive?slug=<serviceSlug> if the school
 * does not have the given service active.
 *
 * Usage (top of a page component):
 *   useServiceGuard("attendance");
 */
export function useServiceGuard(serviceSlug: string) {
  const router = useRouter();
  const { hasService, loading } = useActiveServices();

  useEffect(() => {
    if (loading) return;
    if (!hasService(serviceSlug)) {
      router.replace(`/service-inactive?slug=${encodeURIComponent(serviceSlug)}`);
    }
  }, [loading, serviceSlug]);

  return { loading, allowed: !loading && hasService(serviceSlug) };
}
