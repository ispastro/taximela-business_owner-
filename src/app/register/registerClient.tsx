"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { exchangeHandoffToken } from "@/features/auth/api/exchange-handoff";
import { ApiError } from "@/lib/api-client";
import { useSessionStore } from "@/store/session-store";

const authErrorMessages: Record<string, string> = {
  expired_token: "This link has expired. Please open TaxiMela app and request a new link.",
  invalid_token: "This link is invalid. Please retry from TaxiMela app.",
  used_token: "This link has already been used. Please request a fresh link in TaxiMela app.",
};

function getAuthErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.code && authErrorMessages[error.code]) {
    return authErrorMessages[error.code];
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to verify your link right now. Please try again.";
}

export default function RegisterClient() {
  const searchParams = useSearchParams();
  const handoffToken = searchParams.get("handoff");
  const setSession = useSessionStore((state) => state.setSession);
  const attemptedTokenRef = useRef<string | null>(null);

  const exchangeMutation = useMutation({
    mutationFn: exchangeHandoffToken,
    onSuccess: (result) => {
      setSession({ ownerId: result.ownerId, accessToken: result.accessToken });
    },
  });

  useEffect(() => {
    if (!handoffToken) {
      return;
    }

    if (attemptedTokenRef.current === handoffToken) {
      return;
    }

    attemptedTokenRef.current = handoffToken;
    exchangeMutation.mutate(handoffToken);
  }, [handoffToken, exchangeMutation]);

  return (
    <div className="min-h-screen bg-white px-4 py-6 font-sans sm:px-6 sm:py-10">
      <main className="mx-auto w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Verify your TaxiMela link</h1>

        {!handoffToken ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm leading-6 text-slate-600">
              Mobile handoff is paused for now. You can continue directly to the
              registration form.
            </p>
            <Link
              href="/registration"
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-100 focus:ring-offset-2 sm:w-auto"
            >
              Start registration
            </Link>
          </div>
        ) : null}

        {handoffToken && exchangeMutation.isPending ? (
          <p className="mt-4 text-sm text-slate-600">Checking your secure link…</p>
        ) : null}

        {handoffToken && exchangeMutation.isError ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm text-rose-700">{getAuthErrorMessage(exchangeMutation.error)}</p>
          </div>
        ) : null}

        {handoffToken && exchangeMutation.isSuccess ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">
              Verified successfully. Continue to complete your business registration.
            </p>
            <Link
              href="/registration"
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-100 focus:ring-offset-2 sm:w-auto"
            >
              Continue
            </Link>
          </div>
        ) : null}
      </main>
    </div>
  );
}
