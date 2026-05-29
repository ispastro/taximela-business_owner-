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
  used_token:    "This link has already been used. Please request a fresh link in TaxiMela app.",
};

function getAuthErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.code && authErrorMessages[error.code]) {
    return authErrorMessages[error.code];
  }
  if (error instanceof Error) return error.message;
  return "Unable to verify your link right now. Please try again.";
}

export default function RegisterClient() {
  const searchParams   = useSearchParams();
  const handoffToken   = searchParams.get("handoff");
  const setSession     = useSessionStore((state) => state.setSession);
  const attemptedRef   = useRef<string | null>(null);

  const exchangeMutation = useMutation({
    mutationFn: exchangeHandoffToken,
    onSuccess: (result) => {
      setSession({ ownerId: result.ownerId, accessToken: result.accessToken });
    },
  });

  useEffect(() => {
    if (!handoffToken) return;
    if (attemptedRef.current === handoffToken) return;
    attemptedRef.current = handoffToken;
    exchangeMutation.mutate(handoffToken);
  }, [handoffToken, exchangeMutation]);

  return (
    <div className="min-h-screen bg-shell px-4 py-8 sm:px-6 sm:py-12">
      <main className="mx-auto w-full max-w-lg tx-panel p-6 sm:p-8">

        {/* Brand */}
        <p className="tx-brand mb-5">Taximela</p>

        <h1 className="tx-page-title">Verify your TaxiMela link</h1>

        {/* No token — fallback */}
        {!handoffToken && (
          <div className="mt-5 tx-alert tx-alert-info">
            <p>Mobile handoff is paused. You can continue directly to the registration form.</p>
            <Link href="/registration" className="tx-btn-primary mt-4 inline-flex">
              Start registration
            </Link>
          </div>
        )}

        {/* Pending */}
        {handoffToken && exchangeMutation.isPending && (
          <p className="mt-5 tx-sub-label" style={{ fontSize: "12px" }}>
            Checking your secure link…
          </p>
        )}

        {/* Error */}
        {handoffToken && exchangeMutation.isError && (
          <div className="mt-5 tx-alert tx-alert-error">
            {getAuthErrorMessage(exchangeMutation.error)}
          </div>
        )}

        {/* Success */}
        {handoffToken && exchangeMutation.isSuccess && (
          <div className="mt-5 tx-alert tx-alert-success">
            <p>Verified successfully. Continue to complete your business registration.</p>
            <Link href="/registration" className="tx-btn-primary mt-4 inline-flex">
              Continue
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
