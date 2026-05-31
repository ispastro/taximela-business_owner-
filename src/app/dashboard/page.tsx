"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { OwnerAppShell } from "@/features/owner/components/owner-app-shell";
import { OwnerPageHeader } from "@/features/owner/components/owner-page-header";
import { OwnerSection } from "@/features/owner/components/owner-section";
import { RequiresApprovedBusiness } from "@/features/owner/components/requires-approved-business";
import { getDashboardSummary, getMyBusinesses } from "@/features/registration/api/registration";
import { ProtectedRoute } from "@/lib/auth-provider";
import { useSessionStore } from "@/store/session-store";

type MetricCardProps = {
  label: string;
  value: number;
  accent: "green" | "amber" | "red" | "neutral";
};

const accentClass: Record<MetricCardProps["accent"], string> = {
  green:   "tx-metric-card-accent-green",
  amber:   "tx-metric-card-accent-amber",
  red:     "tx-metric-card-accent-red",
  neutral: "tx-metric-card-accent-neutral",
};

const valueClass: Record<MetricCardProps["accent"], string> = {
  green:   "text-accent",
  amber:   "text-amber",
  red:     "text-red",
  neutral: "text-text",
};

function MetricCard({ label, value, accent }: MetricCardProps) {
  return (
    <div className={`tx-metric-card ${accentClass[accent]}`}>
      <p className="tx-section-header">{label}</p>
      <p className={`tx-metric ${valueClass[accent]}`}>{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <RequiresApprovedBusiness>
        <DashboardContent />
      </RequiresApprovedBusiness>
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

  const businessList = businesses?.data ?? [];

  return (
    <OwnerAppShell width="default">
      <OwnerPageHeader
        divider
        eyebrow="Overview"
        title="Dashboard"
        description="Track your applications and manage approved businesses."
        actions={
          <Link href="/status" className="tx-btn-ghost">
            View application history
          </Link>
        }
      />

      <section className="tx-dashboard-block" aria-label="Application summary">
        <p className="tx-section-header tx-dashboard-block-label">
          Application Summary
        </p>
        <div className="tx-stats-grid">
          {summaryLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="tx-skeleton tx-skeleton-metric" />
            ))
          ) : (
            <>
              <MetricCard label="Total Applications" value={summary?.total_count         ?? 0} accent="neutral" />
              <MetricCard label="Pending Review"     value={summary?.pending_application ?? 0} accent="amber"   />
              <MetricCard label="Approved"           value={summary?.accepted             ?? 0} accent="green"   />
              <MetricCard label="Rejected"           value={summary?.rejected             ?? 0} accent="red"     />
            </>
          )}
        </div>
      </section>

      <OwnerSection
        title="My Businesses"
        description="Select a business to view details or make updates."
      >
        {businessesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="tx-skeleton tx-skeleton-row" />
            ))}
          </div>
        ) : businessList.length === 0 ? (
          <div className="tx-panel tx-empty-state">
            <p className="tx-sub-label" style={{ fontSize: "12px" }}>
              No approved businesses yet.
            </p>
            <Link href="/status" className="tx-link mt-4 inline-block">
              Check application history →
            </Link>
          </div>
        ) : (
          <div className="tx-list-panel">
            {businessList.map((business) => (
              <Link
                key={business.id}
                href={`/businesses/${business.id}`}
                className="tx-list-row"
              >
                <div className="tx-list-row-main">
                  <p className="tx-row-name truncate">{business.name}</p>
                  <p className="tx-sub-label truncate">
                    {business.category_name ?? "Uncategorized"}
                  </p>
                </div>
                <div className="tx-list-row-meta">
                  <span
                    className={
                      business.status === "active"
                        ? "tx-badge tx-badge-green"
                        : "tx-badge tx-badge-red"
                    }
                  >
                    {business.status === "active" ? "Active" : "Suspended"}
                  </span>
                  <span className="tx-row-link-chevron" aria-hidden="true">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </OwnerSection>
    </OwnerAppShell>
  );
}
