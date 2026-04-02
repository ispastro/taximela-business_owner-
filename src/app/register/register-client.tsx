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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12 font-sans">
      <main className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Verify your TaxiMela link</h1>

        {!handoffToken ? (
          <p className="mt-3 text-sm text-zinc-600">
            Missing handoff token. Open this page from TaxiMela app using the
            &quot;Advertise on TaxiMela&quot; action.
          </p>
        ) : null}

        {handoffToken && exchangeMutation.isPending ? (
          <p className="mt-3 text-sm text-zinc-600">Checking your secure link…</p>
        ) : null}

        {handoffToken && exchangeMutation.isError ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{getAuthErrorMessage(exchangeMutation.error)}</p>
          </div>
        ) : null}

        {handoffToken && exchangeMutation.isSuccess ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">
              Verified successfully. Continue to complete your business registration.
            </p>
            <Link
              href="/registration"
              className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
            >
              Continue
            </Link>
          </div>
        ) : null}
      </main>
    </div>
  );
}
