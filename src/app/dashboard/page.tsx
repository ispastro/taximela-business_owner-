"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getDashboardSummary, getMyBusinesses } from "@/features/registration/api/registration";
import { useSessionStore } from "@/store/session-store";
import { ProtectedRoute } from "@/lib/auth-provider";

type MetricCardProps = {
  label: string;
  value: number;
  accent: "green" | "amber" | "red" | "neutral";
};

const accentMap: Record<MetricCardProps["accent"], { value: string; label: string }> = {
  green:   { value: "text-accent",  label: "text-accent"  },
  amber:   { value: "text-amber",   label: "text-amber"   },
  red:     { value: "text-red",     label: "text-red"     },
  neutral: { value: "text-text",    label: "text-text2"   },
};

function MetricCard({ label, value, accent }: MetricCardProps) {
  const colors = accentMap[accent];
  return (
    <div className="tx-panel p-4">
      <p className={`tx-section-header mb-2 ${colors.label}`}>{label}</p>
      <p className={`tx-metric ${colors.value}`}>{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const accessToken = useSessionStore((s) => s.accessToken);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => getDashboardSummary(accessToken ?? ""),
    enabled: !!accessToken,
  });

  const { data: businesses, isLoading: businessesLoading } = useQuery({
    queryKey: ["my-businesses"],
    queryFn: () => getMyBusinesses(accessToken ?? ""),
    enabled: !!accessToken,
  });

  return (
    <div className="min-h-screen bg-shell px-4 py-6 sm:px-6 sm:py-10">
      <main className="mx-auto w-full max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="tx-section-header mb-1">Overview</p>
            <h1 className="tx-page-title">Dashboard</h1>
          </div>
          <Link href="/registration" className="tx-btn-primary">
            + New Registration
          </Link>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {summaryLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="tx-skeleton h-24" />
            ))
          ) : (
            <>
              <MetricCard label="Total"    value={summary?.total_count        ?? 0} accent="neutral" />
              <MetricCard label="Pending"  value={summary?.pending_application ?? 0} accent="amber"   />
              <MetricCard label="Approved" value={summary?.accepted            ?? 0} accent="green"   />
              <MetricCard label="Rejected" value={summary?.rejected            ?? 0} accent="red"     />
            </>
          )}
        </div>

        {/* Businesses list */}
        <div className="mt-8">
          <p className="tx-section-header mb-3">My Businesses</p>

          <div className="space-y-2">
            {businessesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="tx-skeleton h-16" />
              ))
            ) : businesses?.data.length === 0 ? (
              <div className="tx-panel p-6 text-center">
                <p className="tx-sub-label" style={{ fontSize: "12px" }}>No approved businesses yet.</p>
                <Link
                  href="/status"
                  className="mt-2 inline-block tx-sub-label hover:text-accent transition-colors"
                  style={{ fontSize: "12px" }}
                >
                  Check application status →
                </Link>
              </div>
            ) : (
              businesses?.data.map((business) => (
                <Link
                  key={business.id}
                  href={`/businesses/${business.id}`}
                  className="tx-panel flex items-center justify-between p-4 hover:border-accent transition-colors"
                >
                  <div>
                    <p className="tx-row-name">{business.name}</p>
                    <p className="tx-sub-label mt-0.5">{business.category_name ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        business.status === "active"
                          ? "tx-badge tx-badge-green"
                          : "tx-badge tx-badge-red"
                      }
                    >
                      {business.status === "active" ? "Active" : "Suspended"}
                    </span>
                    <span className="text-text3 text-xs">→</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Footer nav */}
        <div className="mt-8 flex gap-5 border-t border-panel-border pt-5">
          <Link
            href="/status"
            className="tx-sub-label hover:text-accent transition-colors"
            style={{ fontSize: "12px" }}
          >
            View applications
          </Link>
          <Link
            href="/register"
            className="tx-sub-label hover:text-text transition-colors"
            style={{ fontSize: "12px" }}
          >
            Back to register
          </Link>
        </div>
      </main>
    </div>
  );
}
