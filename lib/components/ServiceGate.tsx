"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActiveServices } from "@/lib/hooks/useActiveServices";

interface ServiceGateProps {
  slug: string;
  children: React.ReactNode;
}

/**
 * Wrap any page's returned JSX with this component.
 * - Renders null while loading (no flash)
 * - Redirects to /service-inactive?slug=... if not active
 * - Renders children when the service is active
 *
 * Usage:
 *   return (
 *     <ServiceGate slug="attendance">
 *       <div className="page-content">...</div>
 *     </ServiceGate>
 *   );
 */
export function ServiceGate({ slug, children }: ServiceGateProps) {
  const router = useRouter();
  const { hasService, loading } = useActiveServices();

  useEffect(() => {
    if (!loading && !hasService(slug)) {
      router.replace(`/service-inactive?slug=${encodeURIComponent(slug)}`);
    }
  }, [loading, slug]);

  if (loading) return null;
  if (!hasService(slug)) return null;
  return <>{children}</>;
}
