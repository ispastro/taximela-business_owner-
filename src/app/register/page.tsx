import { Suspense } from "react";
import RegisterClient from "./registerClient";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 font-sans">
          <main className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-900">Verify your TaxiMela link</h1>
            <p className="mt-3 text-sm text-slate-600">Loading...</p>
          </main>
        </div>
      }
    >
      <RegisterClient />
    </Suspense>
  );
}
