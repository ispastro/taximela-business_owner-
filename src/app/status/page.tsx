"use client";

import Link from "next/link";

type RegistrationStatus = "draft" | "submitted" | "under_review" | "approved" | "rejected";

const statusLabels: Record<RegistrationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
};

export default function StatusPage() {
  const currentStatus: RegistrationStatus = "submitted";
  const reviewNote: string | null = null;

  return (
    <div className="min-h-screen bg-white px-4 py-6 font-sans sm:px-6 sm:py-10">
      <main className="mx-auto w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Registration Status</h1>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">Current status</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{statusLabels[currentStatus]}</p>
          {reviewNote ? <p className="mt-3 text-sm text-slate-700">Note: {reviewNote}</p> : null}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link href="/registration" className="text-sm font-medium text-indigo-700 underline-offset-4 hover:underline">
            Edit registration
          </Link>
          <Link href="/register" className="text-sm font-medium text-slate-600 underline-offset-4 hover:underline">
            Back to register
          </Link>
        </div>
      </main>
    </div>
  );
}
