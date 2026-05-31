"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { OwnerLoadingScreen } from "@/features/owner/components/owner-loading-screen";
import { useOwnerAccount } from "@/features/owner/hooks/use-owner-account";
import {
  canAccessDashboard,
  resolveDashboardFallback,
} from "@/lib/owner-account";

export function RequiresApprovedBusiness({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data, isLoading, isError } = useOwnerAccount();

  useEffect(() => {
    if (isLoading || isError || !data) return;
    if (!canAccessDashboard(data)) {
      router.replace(resolveDashboardFallback(data));
    }
  }, [data, isLoading, isError, router]);

  if (isLoading) {
    return <OwnerLoadingScreen />;
  }

  if (isError || !data || !canAccessDashboard(data)) {
    return <OwnerLoadingScreen />;
  }

  return <>{children}</>;
}
