"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getMyApplications } from "@/features/registration/api/registration";
import { useSessionStore } from "@/store/session-store";
import { ProtectedRoute } from "@/lib/auth-provider";

const statusStyles: Record<string, { label: string; className: string }> = {
  pending_review: {
    label: "Pending Review",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  approved: {
    label: "Approved",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  rejected: {
    label: "Rejected",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
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
    <div className="min-h-screen bg-white px-4 py-6 font-sans sm:px-6 sm:py-10">
      <main className="mx-auto w-full max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">My Applications</h1>
          <Link
            href="/registration"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + New Registration
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Loading your applications...
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
              Failed to load applications. Please try again.
            </div>
          ) : data?.data.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-500">No applications yet.</p>
              <Link href="/registration" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline">
                Start your first registration →
              </Link>
            </div>
          ) : (
            data?.data.map((app) => {
              const style = statusStyles[app.status] ?? statusStyles.pending_review;
              return (
                <div key={app.id} className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{app.business_name}</p>
                      {app.rejection_reason ? (
                        <p className="mt-1 text-sm text-slate-500">Note: {app.rejection_reason}</p>
                      ) : null}
                    </div>
                    <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${style.className}`}>
                      {style.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6">
          <Link href="/register" className="text-sm font-medium text-slate-500 underline-offset-4 hover:underline">
            ← Back to register
          </Link>
        </div>
      </main>
    </div>
  );
}
