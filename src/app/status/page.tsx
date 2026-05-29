"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getMyApplications } from "@/features/registration/api/registration";
import { useSessionStore } from "@/store/session-store";
import { ProtectedRoute } from "@/lib/auth-provider";

const statusConfig: Record<string, { label: string; badgeClass: string }> = {
  pending_review: { label: "Pending Review", badgeClass: "tx-badge tx-badge-amber" },
  approved:       { label: "Approved",        badgeClass: "tx-badge tx-badge-green" },
  rejected:       { label: "Rejected",        badgeClass: "tx-badge tx-badge-red"   },
};

export default function StatusPage() {
  return (
    <ProtectedRoute>
      <StatusContent />
    </ProtectedRoute>
  );
}

function StatusContent() {
  const accessToken = useSessionStore((s) => s.accessToken);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-applications"],
    queryFn: () => getMyApplications(accessToken ?? ""),
    enabled: !!accessToken,
  });

  return (
    <div className="min-h-screen bg-shell px-4 py-6 sm:px-6 sm:py-10">
      <main className="mx-auto w-full max-w-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="tx-section-header mb-1">Applications</p>
            <h1 className="tx-page-title">My Applications</h1>
          </div>
          <Link href="/registration" className="tx-btn-primary">
            + New
          </Link>
        </div>

        {/* List */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="tx-skeleton h-16" />
            ))
          ) : isError ? (
            <div className="tx-alert tx-alert-error">
              Failed to load applications. Please try again.
            </div>
          ) : data?.data.length === 0 ? (
            <div className="tx-panel p-8 text-center">
              <p className="tx-sub-label" style={{ fontSize: "12px" }}>No applications yet.</p>
              <Link
                href="/registration"
                className="mt-3 inline-block tx-sub-label hover:text-accent transition-colors"
                style={{ fontSize: "12px" }}
              >
                Start your first registration →
              </Link>
            </div>
          ) : (
            data?.data.map((app) => {
              const cfg = statusConfig[app.status] ?? statusConfig.pending_review;
              return (
                <div key={app.id} className="tx-panel p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="tx-row-name">{app.business_name}</p>
                      {app.rejection_reason && (
                        <p className="mt-1 tx-sub-label">Note: {app.rejection_reason}</p>
                      )}
                    </div>
                    <span className={cfg.badgeClass}>{cfg.label}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer nav */}
        <div className="mt-6">
          <Link
            href="/register"
            className="tx-sub-label hover:text-accent transition-colors"
            style={{ fontSize: "12px" }}
          >
            ← Back to register
          </Link>
        </div>
      </main>
    </div>
  );
}
