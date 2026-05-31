"use client";

import { OwnerAppShell } from "@/features/owner/components/owner-app-shell";

export function OwnerLoadingScreen() {
  return (
    <OwnerAppShell width="default">
      <div className="space-y-3">
        <div className="tx-skeleton h-8 w-48" />
        <div className="tx-skeleton h-4 w-72" />
        <div className="tx-skeleton h-24 mt-6" />
        <div className="tx-skeleton h-24" />
        <div className="tx-skeleton h-24" />
      </div>
    </OwnerAppShell>
  );
}
