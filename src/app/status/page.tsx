"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { OwnerAppShell } from "@/features/owner/components/owner-app-shell";
import { OwnerPageHeader } from "@/features/owner/components/owner-page-header";
import { OwnerSection } from "@/features/owner/components/owner-section";
import { useOwnerAccount } from "@/features/owner/hooks/use-owner-account";
import { ProtectedRoute } from "@/lib/auth-provider";
import { hasPendingApplications } from "@/lib/owner-account";

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
  const router = useRouter();
  const { data, isLoading, isError } = useOwnerAccount({ pollWhilePending: true });
  const hadPendingRef = useRef(false);

  const applications = data?.applications ?? [];
  const hasBusinesses = (data?.businesses.length ?? 0) > 0;
  const hasHistory = applications.length > 0;
  const isPending = data ? hasPendingApplications(data) : false;

  useEffect(() => {
    if (!data) return;

    if (hasPendingApplications(data)) {
      hadPendingRef.current = true;
      return;
    }

    if (hadPendingRef.current && data.businesses.length > 0) {
      router.replace("/dashboard");
    }
  }, [data, router]);

  const description = isPending
    ? "Waiting for admin review — this page refreshes automatically."
    : hasHistory
      ? "Your previous business registration submissions."
      : "Submit your first business registration to get started.";

  return (
    <OwnerAppShell width="narrow">
      <OwnerPageHeader
        divider
        eyebrow="Applications"
        title="Application History"
        description={description}
        actions={
          hasBusinesses ? (
            <Link href="/dashboard" className="tx-btn-ghost">
              Open dashboard
            </Link>
          ) : undefined
        }
      />

      {hasBusinesses && !isPending && (
        <div className="tx-alert tx-alert-success tx-dashboard-block">
          You have an approved business.{" "}
          <Link href="/dashboard" className="font-semibold underline">
            Manage it in your dashboard →
          </Link>
        </div>
      )}

      <OwnerSection
        title="Your Submissions"
        description={
          hasHistory
            ? `${applications.length} application${applications.length === 1 ? "" : "s"} on record.`
            : undefined
        }
      >
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="tx-skeleton tx-skeleton-row" />
            ))}
          </div>
        ) : isError ? (
          <div className="tx-alert tx-alert-error">
            Failed to load application history. Please try again.
          </div>
        ) : !hasHistory ? (
          <div className="tx-panel tx-empty-state">
            <p className="tx-sub-label" style={{ fontSize: "12px" }}>
              No applications yet.
            </p>
            <Link href="/registration" className="tx-link mt-4 inline-block">
              Start your first application →
            </Link>
          </div>
        ) : (
          <div className="tx-list-panel">
            {applications.map((app) => {
              const cfg = statusConfig[app.status] ?? statusConfig.pending_review;
              const isApprovedLink = app.status === "approved" && hasBusinesses;

              const rowContent = (
                <>
                  <div className="tx-list-row-main">
                    <p className="tx-row-name truncate">{app.business_name}</p>
                    {app.rejection_reason ? (
                      <p className="tx-sub-label truncate">{app.rejection_reason}</p>
                    ) : isApprovedLink ? (
                      <p className="tx-sub-label">Approved — manage in dashboard</p>
                    ) : app.status === "pending_review" ? (
                      <p className="tx-sub-label">Under admin review</p>
                    ) : null}
                  </div>
                  <div className="tx-list-row-meta">
                    <span className={cfg.badgeClass}>{cfg.label}</span>
                    {isApprovedLink && (
                      <span className="tx-row-link-chevron" aria-hidden="true">→</span>
                    )}
                  </div>
                </>
              );

              if (isApprovedLink) {
                return (
                  <Link key={app.id} href="/dashboard" className="tx-list-row">
                    {rowContent}
                  </Link>
                );
              }

              return (
                <div key={app.id} className="tx-list-row">
                  {rowContent}
                </div>
              );
            })}
          </div>
        )}
      </OwnerSection>
    </OwnerAppShell>
  );
}
