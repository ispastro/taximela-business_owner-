"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getDashboardSummary, getMyBusinesses } from "@/features/registration/api/registration";
import { useSessionStore } from "@/store/session-store";

function StatCard({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className={`rounded-xl border p-5 ${className}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
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
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <main className="mx-auto w-full max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Overview of your TaxiMela business registrations</p>
          </div>
          <Link
            href="/registration"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + New Registration
          </Link>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {summaryLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
            ))
          ) : (
            <>
              <StatCard
                label="Total Applications"
                value={summary?.total_count ?? 0}
                className="border-slate-200 bg-white text-slate-700"
              />
              <StatCard
                label="Pending"
                value={summary?.pending_application ?? 0}
                className="border-amber-200 bg-amber-50 text-amber-700"
              />
              <StatCard
                label="Approved"
                value={summary?.accepted ?? 0}
                className="border-emerald-200 bg-emerald-50 text-emerald-700"
              />
              <StatCard
                label="Rejected"
                value={summary?.rejected ?? 0}
                className="border-rose-200 bg-rose-50 text-rose-700"
              />
            </>
          )}
        </div>

        {/* Businesses List */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">My Businesses</h2>

          <div className="mt-4 space-y-3">
            {businessesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
              ))
            ) : businesses?.data.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                <p className="text-sm text-slate-500">No approved businesses yet.</p>
                <Link href="/status" className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline">
                  Check application status →
                </Link>
              </div>
            ) : (
              businesses?.data.map((business) => (
                <Link
                  key={business.id}
                  href={`/businesses/${business.id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{business.name}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{business.category_name ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      business.status === "active"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}>
                      {business.status === "active" ? "Active" : "Suspended"}
                    </span>
                    <span className="text-slate-400">→</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 flex gap-4 border-t border-slate-200 pt-6">
          <Link href="/status" className="text-sm font-medium text-indigo-600 underline-offset-4 hover:underline">
            View applications
          </Link>
          <Link href="/register" className="text-sm font-medium text-slate-500 underline-offset-4 hover:underline">
            Back to register
          </Link>
        </div>
      </main>
    </div>
  );
}
